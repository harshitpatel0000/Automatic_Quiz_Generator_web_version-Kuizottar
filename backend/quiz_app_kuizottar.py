import os
import random
import string
import json
import re
from datetime import datetime

# --- FLASK IMPORTS ---
from flask import Flask, jsonify, request, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin, current_user
from authlib.integrations.flask_client import OAuth

# --- NLP IMPORTS ---
import nltk
import spacy
import pke
import wikipediaapi
import pdfplumber
from docx import Document
from nltk.corpus import wordnet as wn

# --- INIT FLASK ---
app = Flask(__name__)
# Change origins to match your React dev server
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

app.config['SECRET_KEY'] = 'a_very_secret_key_change_this'
# Ensure this matches your local PostgreSQL setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Your_postgresql_password@localhost:5432/Your_database_name'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

# --- NLTK SETUP (Run once) ---
try:
    nltk.data.find('corpora/wordnet')
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    print("Downloading NLTK data...")
    nltk.download('wordnet')
    nltk.download('omw-1.4')
    nltk.download('punkt')
    nltk.download('averaged_perceptron_tagger')

# --- OAUTH SETUP ---
oauth = OAuth(app)
oauth.register(
    name='google',
    client_id='Enter client id made using google cloud console',
    client_secret='Enter Client secret made using google cloud console', 
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

# ==========================================
# 1. DATABASE MODELS
# ==========================================

class User(UserMixin, db.Model):
    __tablename__ = 'user' 
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True) 
    password_hash = db.Column(db.String(200), nullable=True)
    auth_provider = db.Column(db.String(20), default='local')
    
    # 1. Quizzes Created by User
    quizzes = db.relationship('Quiz', backref='creator', lazy=True)
    # 2. Quizzes Taken by User (Results)
    results = db.relationship('QuizResult', backref='student', lazy=True)

class Quiz(db.Model):
    __tablename__ = 'quiz_generation'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_code = db.Column(db.String(10), unique=True, nullable=False)
    title = db.Column(db.String(200), default="Untitled Quiz") 
    quiz_data = db.Column(db.Text, nullable=False) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)


class QuizResult(db.Model):
    __tablename__ = 'quiz_results'
    
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.String(20), nullable=False) # Stores "4/5"
    
    user_answers = db.Column(db.Text, nullable=True)
    
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz_generation.id'), nullable=False)
    
    # Relationship to access Quiz details (like title) from the result
    quiz = db.relationship('Quiz', backref='attempts')


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ==========================================
# 2. NLP LOGIC (The Brains)
# ==========================================

def get_text_from_file(file_path, ext):
    text = ""
    try:
        if ext == 'pdf':
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted: text += extracted + "\n"
        elif ext == 'docx':
            doc = Document(file_path)
            text = "\n".join([p.text for p in doc.paragraphs])
        elif ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
    return text

def get_wikipedia_summary(topic):
    wiki_wiki = wikipediaapi.Wikipedia('QuizGenBot/1.0', 'en') 
    page = wiki_wiki.page(topic)
    if page.exists():
        return page.summary
    return None

def get_distractors_wordnet(word):
    distractors = set()
    synsets = wn.synsets(word)
    if not synsets: return []
    target_synset = None
    for s in synsets:
        if s.pos() == 'n':
            target_synset = s
            break
    if not target_synset: return []
    hypernyms = target_synset.hypernyms()
    if not hypernyms: return []
    for hypernym in hypernyms:
        for hyponym in hypernym.hyponyms():
            name = hyponym.lemmas()[0].name().replace('_', ' ')
            if name.lower() != word.lower():
                distractors.add(name)
                if len(distractors) >= 3: break
        if len(distractors) >= 3: break
    return list(distractors)

def generate_questions_pke(text, num_questions=5, difficulty="Medium"):
    # 1. Clean text slightly
    text = re.sub(r'\[\d+\]', '', text)
    text = text.replace('\n', ' ')
    
    # 2. Initialize PKE
    try:
        extractor = pke.unsupervised.MultipartiteRank()
        extractor.load_document(input=text, language='en')
        extractor.candidate_selection()
        extractor.candidate_weighting()
    except Exception as e:
        print(f"PKE Error: {e}")
        return []
    
    # 3. Get Candidates
    pool_size = max(50, num_questions * 5)
    all_keyphrases = extractor.get_n_best(n=pool_size)
    
    # Filter based on difficulty (Simplified logic for robustness)
    total_candidates = len(all_keyphrases)
    if total_candidates == 0:
        return []
        
    start_index = 0
    if difficulty == "Hard":
        start_index = total_candidates // 3
    elif difficulty == "Expert":
        start_index = total_candidates // 2
        
    # Grab the best candidates based on difficulty settings
    selected_candidates = all_keyphrases[start_index : start_index + num_questions * 2]
    
    # Fallback: If not enough hard ones, just take the top ones
    if len(selected_candidates) < num_questions:
        selected_candidates = all_keyphrases[:num_questions * 2]

    random.shuffle(selected_candidates)
    
    questions = []
    sentences = nltk.sent_tokenize(text)
    used_sentences = set()

    for keyphrase_score in selected_candidates:
        if len(questions) >= num_questions:
            break
            
        keyword = keyphrase_score[0]
        
        # Find a sentence containing this keyword
        target_sentence = None
        for sent in sentences:
            # Rule: Sentence must have keyword, be 5-80 words long, and not used yet
            if keyword in sent.lower() and 5 < len(sent.split()) < 80 and sent not in used_sentences:
                target_sentence = sent
                break
        
        if not target_sentence:
            continue

        used_sentences.add(target_sentence)

        # Create Blank (Case insensitive replace)
        pattern = re.compile(re.escape(keyword), re.IGNORECASE)
        question_text = pattern.sub("______", target_sentence)
        
        # Generate Options
        options = [keyword]
        
        # Try WordNet
        smart_distractors = get_distractors_wordnet(keyword)
        options.extend(smart_distractors)
        
        # Fallback: Random Nouns from text
        if len(options) < 4:
            tokens = nltk.word_tokenize(text)
            tags = nltk.pos_tag(tokens)
            nouns = list(set([w for w, t in tags if t.startswith('NN') and w.lower() != keyword.lower()]))
            random.shuffle(nouns)
            options.extend(nouns[:4-len(options)])
            
        # Final Fallback
        while len(options) < 4:
            options.append("None of the above")

        # Shuffle options
        options = options[:4]
        random.shuffle(options)
        
        questions.append({
            "question": question_text,
            "options": options,
            "answer": keyword
        })

    return questions

def generate_unique_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

# ==========================================
# 3. ROUTES
# ==========================================

@app.route('/')
def index():
    return "Quiz Backend Running"

@app.route('/api/generate', methods=['POST'])
@login_required
def generate_quiz_route():
    try:
        active_tab = request.form.get('activeTab') 
        count = int(request.form.get('questionCount', 5))
        time_limit = int(request.form.get('timeLimit', 30))
        difficulty = request.form.get('difficulty', 'Medium')
        attempts = int(request.form.get('attempts', 1))
        
        text_content = ""
        quiz_title = "Generated Quiz"

        if active_tab == 'web':
            topic = request.form.get('topic')
            quiz_title = f"Quiz: {topic}"
            text_content = get_wikipedia_summary(topic)
        elif active_tab == 'local':
            file = request.files['file']
            filename = secure_filename(file.filename)
            quiz_title = f"Quiz: {filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            ext = filename.rsplit('.', 1)[1].lower()
            text_content = get_text_from_file(save_path, ext)
            os.remove(save_path)

        if not text_content: return jsonify({"message": "Error"}), 400

        questions_list = generate_questions_pke(text_content, count, difficulty) 
        
        unique_code = generate_unique_code()
        
        full_quiz_data = {
            "meta": {
                "difficulty": difficulty,
                "time_per_question": time_limit,
                "total_questions": len(questions_list),
                "max_attempts": attempts 
            },
            "questions": questions_list
        }

        new_quiz = Quiz(
            quiz_code=unique_code,
            title=quiz_title,
            quiz_data=json.dumps(full_quiz_data), 
            creator_id=current_user.id
        )
        
        db.session.add(new_quiz)
        db.session.commit()

        return jsonify({
            "message": "Quiz generated successfully",
            "quiz_code": unique_code,
            "title": quiz_title,
            "count": len(questions_list)
        }), 200

    except Exception as e:
        return jsonify({"message": f"Server Error: {str(e)}"}), 500

# --- NEW ROUTE: Get Quiz Data for Player ---
@app.route('/api/quiz/<quiz_code>', methods=['GET'])
@login_required
def get_quiz_details(quiz_code):
    quiz = Quiz.query.filter_by(quiz_code=quiz_code).first()
    
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404
        
    # Note: We do NOT strictly check creator_id here, 
    # because other users need to access this route to Play the quiz.
    
    return jsonify({
        "title": quiz.title,
        "created_at": quiz.created_at.strftime("%Y-%m-%d"),
        "quiz_code": quiz.quiz_code,
        "data": json.loads(quiz.quiz_data) 
    }), 200

# --- NEW ROUTE: Submit Quiz Score ---
@app.route('/api/quiz/<quiz_code>/submit', methods=['POST'])
@login_required
def submit_quiz_score(quiz_code):
    try:
        data = request.json
        score_val = data.get('score') # Expecting string like "4/5"
        answers_log = data.get('answers') # List of user selections
        quiz = Quiz.query.filter_by(quiz_code=quiz_code).first()
        if not quiz:
            return jsonify({"message": "Quiz not found"}), 404

        # Create Result Entry
        result = QuizResult(
            score=score_val,
            # Save list as JSON string
            user_answers=json.dumps(answers_log) if answers_log else None,
            user_id=current_user.id,
            quiz_id=quiz.id
        )
        
        db.session.add(result)
        db.session.commit()
        
        return jsonify({"message": "Score saved successfully"}), 200
    except Exception as e:
        return jsonify({"message": f"Error saving score: {str(e)}"}), 500

@app.route('/api/result/<int:result_id>', methods=['GET'])
@login_required
def get_result_details(result_id):
    result = QuizResult.query.get(int(result_id))
    
    if not result or result.user_id != current_user.id:
        return jsonify({"message": "Result not found or unauthorized"}), 404
        
    quiz_data = json.loads(result.quiz.quiz_data)
    user_answers = json.loads(result.user_answers) if result.user_answers else []
    
    return jsonify({
        "title": result.quiz.title,
        "quiz_code": result.quiz.quiz_code,
        "score": result.score,
        "date": result.completed_at.strftime("%Y-%m-%d"),
        "quiz_data": quiz_data,
        "user_answers": user_answers # Sending selections to frontend
    }), 200

# --- DASHBOARD ROUTE ---
@app.route('/api/dashboard', methods=['GET'])
@login_required
def get_dashboard_data():
    history_log = []

    # 1. Get Quizzes CREATED by user
    created_quizzes = current_user.quizzes 
    for q in created_quizzes:
        history_log.append({
            "id": q.id,
            "title": q.title,
            "quiz_code": q.quiz_code,
            "type": "Generated",
            "date": q.created_at.strftime("%Y-%m-%d"),
            "score": "N/A"
        })

    # 2. Get Quizzes TAKEN by user
    taken_quizzes = current_user.results
    for r in taken_quizzes:
        history_log.append({
            "id": r.id, # Using result ID ensures unique keys if they take same quiz twice
            "title": r.quiz.title, # Access title via relationship
            "quiz_code": r.quiz.quiz_code,
            "type": "Assessed",
            "date": r.completed_at.strftime("%Y-%m-%d"),
            "score": r.score
        })

    # Sort by date (newest first)
    history_log.sort(key=lambda x: x['date'], reverse=True)

    return jsonify({
        "user": {"name": current_user.username},
        "history": history_log
    }), 200

@app.route('/api/quiz/<quiz_code>/leaderboard', methods=['GET'])
@login_required
def get_quiz_leaderboard(quiz_code):
    # 1. Find the quiz by code
    quiz = Quiz.query.filter_by(quiz_code=quiz_code).first()
    
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404
        
    # 2. Security Check: Only the generator can see the leaderboard
    if quiz.creator_id != current_user.id:
        return jsonify({"message": "Access restricted to quiz generator"}), 403

    # 3. Fetch all attempts (QuizResult entries) for this quiz
    results = QuizResult.query.filter_by(quiz_id=quiz.id).all()
    
    leaderboard = []
    for r in results:
        # Fetch score percentage (assuming score is stored as "X/Total")
        # Split "4/5" into 4 and 5 to calculate percentage
        score_parts = r.score.split('/')
        percentage = "0%"
        if len(score_parts) == 2:
            try:
                percentage = f"{(int(score_parts[0]) / int(score_parts[1]) * 100):.1f}%"
            except:
                percentage = "Error"

        leaderboard.append({
            "user_id": r.student.id,
            "user_name": r.student.username,
            "score": r.score,
            "percentage": percentage,
            "date": r.completed_at.strftime("%Y-%m-%d %H:%M")
        })

    # Sort leaderboard by percentage (descending)
    leaderboard.sort(key=lambda x: float(x['percentage'].strip('%')), reverse=True)

    return jsonify({
        "quiz_title": quiz.title,
        "leaderboard": leaderboard
    }), 200

# --- AUTH ROUTES ---
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"message": "Username or Email already taken"}), 409
    hashed_pw = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(username=username, email=email, password_hash=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Account created successfully!"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or user.auth_provider == 'google' or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401
    login_user(user)
    return jsonify({"message": "Login successful", "username": user.username}), 200

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out"}), 200

# --- OAUTH ---
@app.route('/login/google')
def google_login():
    google = oauth.create_client('google')
    redirect_uri = 'http://localhost:5000/google/callback'
    return google.authorize_redirect(redirect_uri)

@app.route('/google/callback')
def google_callback():
    token = oauth.google.authorize_access_token()
    user_info = token.get('userinfo') or oauth.google.get('userinfo').json()
    email = user_info['email']
    name = user_info['name']
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(username=name, email=email, password_hash=None, auth_provider='google')
        db.session.add(user)
        db.session.commit()
    login_user(user)
    return redirect('http://localhost:3000/dashboard') 

if __name__ == '__main__':
    with app.app_context():
        #db.drop_all() # Only use if you want to wipe data
        db.create_all() # This will create the tables
    app.run(debug=True, port=5000)
