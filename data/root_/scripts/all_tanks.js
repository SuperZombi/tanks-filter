main()
function main(){
	document.title = LANG.tanks_filter
	document.querySelectorAll('details').forEach((el) => {
		new Accordion(el);
	});

	initFilterItems()
	initSortBy()
	rebuildPage()

	document.querySelectorAll("#toTop").forEach((el)=>{
		el.parentElement.onscroll = function(){showScrollTop(el.parentElement);}
		el.onclick = _=> {
			el.parentElement.scrollTo(0,0)
			window.scrollTo(0,0)
		}
	})
}

function showScrollTop(element){
	if (element.scrollY > 200 || element.scrollTop > 200){
		document.getElementById("toTop").style.bottom = "5px"
	}
	else{
		document.getElementById("toTop").style.bottom = "-50%"
	}
}


function initFilterItems() {
	let filter_area = document.querySelector(".filters-main")
	let filter_summary = document.querySelector(".filters-main summary")
	filter_summary.onclick = _=>{
		filter_area.classList.toggle("opened")
	}
	document.querySelectorAll(".filters .filter .item").forEach(el=>{
		el.onclick = _=>{
			if (el.classList.contains("oneselect")){
				let temp = el.parentElement.querySelector(".active")
				if (temp && temp != el){temp.classList.remove("active")}
			}
			el.classList.toggle("active")
		}
	})
	let url = new URL(window.location.href);
	if (url.searchParams.get('filter')){
		document.querySelector('.filters-main').open = true;
		document.querySelector('.filters-main').classList.add("opened");
		document.querySelector('.filters-main summary').classList.add("applied-filter");
		resetButtonControler("display")

		let arr = JSON.parse(url.searchParams.get('filter'))
		Object.keys(arr).forEach(key=>{
			if (window.innerWidth > 500){
				document.querySelector(`.filters .filter[name='${key}']`).open = true;
			}
			document.querySelector(`.filters .filter[name='${key}']`).classList.add("using")
			arr[key].forEach(val=>{
				let temp = document.querySelector(`.filters .filter[name='${key}'] .item[name='${val}']`)
				temp.classList.add("active")
			})
		})
	}
}
function initSortBy(){
	function createArrow(orderby, parrent){
		let new_ = document.createElement("span")
		new_.id = "sort-arrow"
		new_.setAttribute("sortby", parrent.getAttribute("sortby"))
		new_.setAttribute("order", orderby)
		if (orderby == "desc"){
			new_.innerHTML = "↓"
		}
		else if (orderby == "asc"){
			new_.innerHTML = "↑"
		}
		parrent.appendChild(new_)
	}
	function arrrowController(element){
		let span = element.querySelector("#sort-arrow")
		if (!span){
			let old = document.querySelector("#items-header #sort-arrow")
			if (old){old.remove()}
			createArrow("desc", element)
		}
		else{
			if (span.getAttribute("order") == "desc"){
				span.setAttribute("order", "asc")
				span.innerHTML = "↑"
			}
			else if (span.getAttribute("order") == "asc"){
				span.setAttribute("order", "desc")
				span.innerHTML = "↓"
			}
		}
	}
	document.querySelectorAll("#items-header .focusable").forEach(el=>{
		el.onclick = _=>{
			arrrowController(el)
			parseSortBy()
		}
	})
	let url = new URL(window.location.href);
	if (url.searchParams.get('sorting')){
		let temp = JSON.parse(url.searchParams.get('sorting'))
		let parrent = document.querySelector(`#items-header .focusable[sortby='${temp['sortby']}']`)
		createArrow(temp['order'], parrent)
	}
	else{
		arrrowController(document.querySelector("#items-header .focusable"))
		parseSortBy(false)
	}
}


function resetButtonControler(action){
	if (action == "display"){
		document.querySelector(".filters .reset").style.display = "flex"
		document.querySelector("#filters-overflow").classList.remove("maximum")
	}
	else if (action == "hide"){
		document.querySelector(".filters .reset").style.display = "none"
		document.querySelector("#filters-overflow").classList.add("maximum")
	}
}
function resetFiler(){
	navigator.vibrate(50);
	document.querySelectorAll(".filters .filter .item.active").forEach(el=>{
		el.classList.remove("active")
	})
	parseFilers()
}
function parseFilers(){
	let els = document.querySelectorAll(".filters .filter")
	let filters = {}
	els.forEach(el=>{
		let filter_name = el.getAttribute("name")
		let filtering = el.querySelectorAll(".item.active")
		if (filtering.length > 0){
			el.classList.add("using")
			filters[filter_name] = [...filtering].map(e=>{
				let str = e.getAttribute("name")
				if (!isNaN(str) && !isNaN(parseFloat(str))){
					return parseFloat(str)
				}
				else if (str === 'true' || str === 'false'){
					return str === 'true' ? true : false;
				}
				return str
			})
		}
		else{ el.classList.remove("using") }
	})
	let url = new URL(window.location.href);
	if (Object.keys(filters).length == 0){
		resetButtonControler("hide")
		url.searchParams.delete('filter')
		document.querySelector('.filters-main summary').classList.remove("applied-filter");
	}
	else{
		resetButtonControler("display")
		url.searchParams.set('filter', JSON.stringify(filters))
		document.querySelector('.filters-main summary').classList.add("applied-filter");
	}

	let old_url = decodeURIComponent(window.location.href)
	let new_url = decodeURIComponent(url.href)
	if (old_url != new_url){
		window.history.pushState({},'', new_url);
		rebuildPage()
	}
}
function parseSortBy(rebuild=true){
	let arrow = document.querySelector("#sort-arrow")
	let sorting = {"sortby": arrow.getAttribute("sortby"), "order":  arrow.getAttribute("order")}
	let url = new URL(window.location.href);
	url.searchParams.set('sorting', JSON.stringify(sorting))
	window.history.pushState({},'', decodeURIComponent(url.href));
	if (rebuild){
		rebuildPage()
	}
}


const roman_numerals = function(str){
	const arr = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X"}
	return arr[str]
}
async function rebuildPage() {
	document.querySelector("#items-area").innerHTML = LANG.loading;
	async function makeRequest(){
		let url = new URL(window.location.href);
		const response = await fetch("/api/all_tanks_filter", {
			method: 'POST', headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				"filter": url.searchParams.get("filter"),
				"sorting": url.searchParams.get("sorting")
			})
		});
		if (response.ok){return response.json()}
		return false
	}
	let answer = await makeRequest();
	if (answer){
		document.querySelector("#founded .counter").innerHTML = answer['tanks'].length
		var items_area = document.querySelector("#items-area");
		items_area.innerHTML = ""
		for (const tank of answer['tanks']){
			let tank_type_icon = `<div class="type"><img src="root_/images/type-${tank['type']}.png"></div>`
			if (tank['premium']){
				tank_type_icon = `<div class="type premium"><img src="root_/images/type-${tank['type']}-premium.png"></div>`
			}
			let el = document.createElement("a")
			el.className = "item"
			el.href = `https://wiki.wargaming.net/Tank:${tank['id']}`
			el.target="blank"
			el.innerHTML = 
			`
				<div class="nation"><img src="root_/images/nation-${tank['nation']}.png"></div>
				${tank_type_icon}
				<div class="tier">${roman_numerals(tank['tier'])}</div>
				<div class="icon"><img src="${tank['img']}"></div>
				<div class="name">${tank['short_name']}</div>
			`
			items_area.appendChild(el)
			await sleep(1)
		}
	}
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}