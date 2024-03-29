from pprint import pprint
import requests
from PySimpleDB import DataBase
import time
database = DataBase("tanks.bd")

def download():
	r = requests.get("https://tanks.gg/api/list")

	all_tanks = r.json()['tanks']
	all_length = len(all_tanks)
	for i, tank in enumerate(all_tanks):
		print(f"{i+1}/{all_length}", end="\r")
		link = f"https://tanks.gg/api/tank/{tank['slug']}"
		req = requests.get(link)
		tank_info = req.json()['tank']

		# if tank_info.get('hidden') == False:
		final = {}
		final['name'] = tank_info.get("name")
		final['short_name'] = tank_info.get("short_name")
		final['nation'] = tank_info.get("nation")
		final['tier'] = tank_info.get("tier")
		final['type'] = tank_info.get("type")
		final['id'] = tank_info.get('id')
		final['tank_id'] = tank_info.get('tank_id')
		final['slug'] = tank_info.get('slug')
		final['price'] = tank_info.get('price')
		final['gold_price'] = tank_info.get('gold_price')
		final['img'] = f"https://tanks.gg/img/tanks/{tank_info.get('nation')}-{tank_info.get('id')}.png"
		final['vehicle_role'] = tank_info.get("vehicle_role")
		final['vehicle_role_desc'] = tank_info.get("vehicle_role_desc")
		final['crew'] = list(set(  map( lambda x: x['filled_by'], tank_info.get("crew", []) )  ))
		final['premium'] = tank_info.get("gold_price", 0) > 0

		database.add(**final)
		# time.sleep(0.1)

# download()

def sort_crew():
	for i, data in enumerate(database.data):
		database.data[i]['crew'] = sorted(data['crew'])
	database.save()

# sort_crew()


def get_unical_vals():
	neeeded = ["nation", "type", "vehicle_role", "vehicle_role_desc", "crew"]
	final = {}
	for need in neeeded:
		unswer = []
		for i, data in enumerate(database.data):
			if isinstance(data[need], list):
				unswer.extend(data[need])
			else:
				unswer.append(data[need])
		final[need] = set(unswer)

	print(final)

# get_unical_vals()

def find_dublicates():
	unicals = []
	not_unicals = []
	for tank in database.data:
		if tank['id'] in unicals:
			not_unicals.append(tank['name'])
		else:
			unicals.append(tank['id'])
	for i in not_unicals:
		print(i)

# find_dublicates()


def compare_bases(db1, db2, changesdb="changes.db"):
	database1 = DataBase(db1)
	database2 = DataBase(db2)
	diffs = {}
	for i, data in enumerate(database1.data):
		name = data['name']
		if database2.find(name=name) == None:
			diffs[i] = name
	
	if len(diffs) > 0:
		pprint(list(diffs.values()))
		x = input("Delete this items? (Y/n)\n")
		if x.lower() == "y":
			for id_ in reversed(diffs):
				database1.delete(id_)
			print("Successfully deleted")
		elif x.lower() == "n":
			x = input("Want to make file with changes? (Y/n)\n")
			if x.lower() == "y":
				tempdatabase = DataBase(changesdb)
				for id_ in diffs:
					val = database1.get(id_)
					tempdatabase.add(**val)
	else:
		print("OK")

# compare_bases("tanks.bd", "tanks_back.bd")
