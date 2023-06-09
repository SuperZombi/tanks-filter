from flask import Flask, request, redirect, jsonify, send_from_directory, send_file, abort
from flask_cors import CORS
import os
import json
from PySimpleDB import DataBase
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app)

mydb = DataBase("tanks.bd")
last_db_update = int(os.path.getmtime("tanks.bd"))


def find_languages(folder=""):
	files = [os.path.splitext(f)[0] for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
	return files
	
supported_languages = find_languages(os.path.join("data", "root_", "Langs"))

@app.before_request
def before_request():
	request_path = request.full_path.strip("/").split('/')
	if len(request_path[0]) == 2 and request_path[0] in supported_languages: pass
	elif request_path[0] == "api": pass
	else:
		user_lang = request.cookies.get('lang')
		if user_lang and user_lang in supported_languages:
			request_path.insert(0, user_lang)
		else:
			lang = request.accept_languages.best_match(supported_languages)
			auto_lang = lang if lang else supported_languages[0]
			request_path.insert(0, auto_lang)
		return redirect("/" + "/".join(request_path))


@app.route('/<lang>/<path:filepath>')
def data(lang, filepath):
	filepath = "" if filepath == '/' else filepath
	p = os.path.join("data", filepath)
	if os.path.exists(p):
		if os.path.isfile(p):
			return send_from_directory('data', filepath)
		if request.path[-1] != "/":
			return redirect(request.path + "/")
		if os.path.isfile(os.path.join(p, 'index.html')):
			return send_from_directory('data', os.path.join(filepath, 'index.html'))
	if os.path.isfile(p + '.html'):
		return send_from_directory('data', filepath + '.html')
	abort(404)

@app.route('/<lang>')
@app.route('/<lang>/')
def index(lang):
	return redirect("/" + lang + "/all")



def filter_tanks(params):
	def search_helper(input_list, key, search_param):
		unswer = []
		for data in input_list:
			if isinstance(data[key], list):
				return_this = True
				for input_el in search_param:
					if not input_el in data[key]:
						return_this = False
						break
				if return_this:
					unswer.append(data)
			else:
				for input_el in search_param:
					if input_el == data[key]:
						unswer.append(data)
		return unswer

	if len(params.keys()) == 0:
		return mydb.get_all()
	unswer = []
	x = 0
	for key, param in params.items():
		if x == 0:
			unswer = search_helper(mydb.get_all(), key, param)
		else:
			unswer = search_helper(unswer, key, param)
		x += 1
	return unswer

def sort_tanks(array, sortby, order):
	if sortby == "nation":
		nations = ['ussr', 'germany', 'usa', 'france', 'uk', 'czech', 'china', 'japan', 'poland', 'sweden', 'italy']
		return sorted(array, key=lambda x: nations.index(x["nation"]), reverse=(order=="asc"))
	elif sortby == "tier":
		return sorted(array, key=lambda x: x["tier"], reverse=(order=="desc"))
	elif sortby == "price":
		return sorted(array, key=lambda x: x["price"], reverse=(order=="desc"))
	elif sortby == "type":
		types = ['light-true', 'light-false',
				'medium-true', 'medium-false',
				'heavy-true', 'heavy-false',
				'td-true', 'td-false',
				'spg-true', 'spg-false']
		return sorted(array, key=lambda x: types.index(x["type"] + "-" + str(x["premium"]).lower()), reverse=(order=="asc"))
	return array

@app.route('/api/all_tanks_filter', methods=['POST'])
def all_tanks():
	try:
		filter_params = request.json.get("filter")
		if not filter_params: filter_params = "{}"
		filter_params = json.loads(filter_params)
		answer = filter_tanks(filter_params)


		sorting_params = request.json.get("sorting")
		if not sorting_params: sorting_params = "{}"
		sorting_params = json.loads(sorting_params)
		answer = sort_tanks(answer, sorting_params.get("sortby"), sorting_params.get("order"))

		return jsonify({"tanks": answer, 'last_db_update': last_db_update})
	except Exception as e:
		print(e)
		abort(400)


if __name__ == '__main__':
	# app.run(debug=True)
	app.run(host='0.0.0.0', port='80')
