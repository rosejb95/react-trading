from flask import Flask, render_template, request, Response
from flask_cors import CORS
import json
import os


app = Flask(__name__)
CORS(app)


@app.route("/")
def homepage():
    return render_template("index.html")


@app.route("/search/trade", methods=["GET"])
def search_trades():
    TRADE_DATA_FILE = os.path.join(app.root_path, "data", "trades.json")

    request_filters = {}

    if not len(request.args):
        return []

    request_filters["contact_id"] = request.args.get("contact_id")

    request_filters = {
        key: val for key, val in request_filters.items() if val is not None
    }

    with open(TRADE_DATA_FILE, "r") as f:
        trades = json.load(f)

    # Return trades matching all requested criteria as JSON.
    matched_trades = [
        trade
        for trade in trades
        if all([trade.get(key) == value for key, value in request_filters.items()])
    ]

    return matched_trades

@app.route("/bulk/trade", methods=["POST"])
def print_trades():
    print(request.data)

    return json.dumps({"success": True}), 200, {'ContentType': 'application/json'}


@app.route("/contact/<id>", methods=["GET"])
def get_contact(id: str):

    contacts = load_all_contacts()
    filtered_contacts = [contact for contact in contacts if contact["id"] == id]

    return (
        Response("Contact not found.", status=400)
        if not filtered_contacts
        else filtered_contacts[0]
    )


def load_all_contacts():
    CONTACT_DATA_FILE = os.path.join(app.root_path, "data", "contacts.json")

    with open(CONTACT_DATA_FILE, "r") as f:
        contacts = json.load(f)

    return contacts


@app.route("/search/contact", methods=["GET"])
def search_contacts():
    DEFUALT_ITEM_LIMIT = 5

    for term in request.args:
        print(term)

    search_term = request.args.get("search_input")
    limit = request.args.get("limit", DEFUALT_ITEM_LIMIT)

    if not search_term:
        return []

    contacts = load_all_contacts()

    matched_contacts = [
        contact
        for contact in contacts
        if search_term in contact["first_name"] or search_term in contact["last_name"]
    ][: limit]

    return matched_contacts


@app.route("/components/search_box", methods=["GET"])
def get_search_box() -> str:
    # If a contact is not yet selected, may be None.

    return render_template(
        "search_box.html",
        contacts=[],
    )


def get_contact(contact_id: str):
    CONTACT_DATA_FILE = os.path.join("data", "contacts.json")

    with open(CONTACT_DATA_FILE, "r") as f:
        contacts = json.load(f)

    return [contact for contact in contacts if contact["id"] == contact_id][0]


if __name__ == "__main__":
    app.run(debug=True)
