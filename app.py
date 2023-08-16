from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
from werkzeug.utils import secure_filename
from flask import send_from_directory

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///profiles.db'
db = SQLAlchemy(app)
migrate = Migrate(app, db)


class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, nullable=False)
    photo_url = db.Column(db.String(255), nullable=True) # 추가된 코드

class ChatLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(10), nullable=False)

    



UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/netlify/<path:filename>')
def serve_netlify_files(filename):
    return send_from_directory(os.path.join('static', 'netlify'), filename)

@app.route('/save_chat/<int:profile_id>', methods=['POST'])
def save_chat(profile_id):
    sender = request.form.get('sender')
    message = request.form.get('message')

    new_chat = ChatLog(profile_id=profile_id, sender=sender, message=message)
    db.session.add(new_chat)
    db.session.commit()

    return {"success": True}

@app.route('/load_chat/<int:profile_id>', methods=['GET'])
def load_chat(profile_id):
    chat_logs = ChatLog.query.filter_by(profile_id=profile_id).all()

    response_data = []
    for chat in chat_logs:
        response_data.append({"sender": chat.sender, "message": chat.message})

    return {"success": True, "chat_logs": response_data}




@app.route('/')
def index():
    profiles = Profile.query.all()
    return render_template('index.html', profiles=profiles)

@app.route('/delete_profile/<int:profile_id>', methods=['POST'])
def delete_profile(profile_id):
    profile = Profile.query.get(profile_id)
    
    if profile:
        db.session.delete(profile)
        db.session.commit()
        return {"success": True}
    
    return {"error": "Profile not found"}, 404

@app.route('/update_profile/<int:profile_id>', methods=['POST'])
def update_profile(profile_id):
    profile = db.session.query(Profile).get(profile_id)

    
    if profile:
        name = request.form.get('name')
        bio = request.form.get('bio')
        photo = request.files.get('photo')
        
        profile.name = name
        profile.bio = bio
        
        if photo:
            filename = secure_filename(photo.filename)
            photo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            photo_url = url_for('static', filename='uploads/' + filename)
            profile.photo_url = photo_url
        
        db.session.commit()
        return {"success": True}
    
    return {"error": "Profile not found"}, 404

@app.route('/chat/<int:profile_id>')
def chat(profile_id):
    profile = Profile.query.get(profile_id)
    if profile:
        return render_template('chat.html', profile=profile)
    else:
        return redirect(url_for('index'))


@app.route('/add_profile', methods=['POST'])
def add_profile():
    name = request.form.get('name')
    bio = request.form.get('bio')
    photo = request.files.get('photo')

    # 이미지를 서버에 저장하고 그 URL 가져오기
    if photo:
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        photo_url = url_for('static', filename='uploads/' + filename)
    else:
        photo_url = None

    new_profile = Profile(name=name, bio=bio, photo_url=photo_url)
    db.session.add(new_profile)
    db.session.commit()

    return {"success": True, "profile_id": new_profile.id, "photo_url": photo_url}  # 새로 저장된 프로필의 ID를 반환합니다.



if __name__ == '__main__':
    app.run(debug=True)
