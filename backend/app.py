import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import inspect

load_dotenv()


def create_app():
    app = Flask(__name__, static_folder=None)
    app.config.from_object("config.Config")
    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

    from models import db
    db.init_app(app)

    with app.app_context():
        if not inspect(db.engine).get_table_names():
            db.create_all()

    from routes.auth import auth_bp
    from routes.blog import blog_bp
    from routes.projects import projects_bp
    from routes.uploads import uploads_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(blog_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(uploads_bp)

    static_dir = os.path.join(os.path.dirname(__file__), "static")

    # Serve React app — catch-all for client-side routing
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        if path and os.path.exists(os.path.join(static_dir, path)):
            return send_from_directory(static_dir, path)
        return send_from_directory(static_dir, "index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
