# Those are the libaries need to pip install in the local PC
# And this file has to be run in local and should not be included in the upload of extension
from flask import Flask, request, jsonify
from openai import OpenAI
from flask_cors import CORS


API_KEY = ""
# openai.api_key = "..."
client = OpenAI(
    api_key=API_KEY
)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/explanation', methods=['POST'])
def get_explanation():
    data = request.json
    code_snippet = data.get('code', '')

    if not code_snippet:
        return jsonify({"error": "No code snippet provided"}), 400

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system",
                "content": "You are a knowledgeable coding assistant."},
                {"role": "user",
                "content": f"Explain the following code briefly\n\n{code_snippet}"}
                # ,{"role": "assistant",
                # "content": "The sky appears blue because of Rayleigh scattering, where shorter blue wavelengths are scattered more than other colors by the Earth's atmosphere."}
            ],
            max_tokens=5000,
            stop=None,
            temperature=0.7,
            n=1
        )

        explanation = response.choices[0].message.content.strip()
        return jsonify({"explanation": explanation})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/followup', methods=['POST'])
def follow_up_question():
    data = request.json
    question = data.get('question', '')
    file_content = data.get('fileContent', '')

    if not question:
        return jsonify({"error": "Question missing"}), 400

    try:
        messages=[
                {"role": "system", "content": "You are a helpful coding assistant."},
                {"role": "user", "content": f"Explain the follow_up_question in details:\n\n{question}"}
        ]

        # Include file content if uploaded
        if file_content:
            messages.append({"role": "user", "content": f"Here is an additional file related:\n\n{file_content}"})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=5000,
            stop=None,
            temperature=0.7,
            n=1
        )
        answer = response.choices[0].message.content.strip()
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)


# This is where to communicate with API