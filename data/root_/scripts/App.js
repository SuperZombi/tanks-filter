(function(){
	let el = document.createElement('style');
	el.innerHTML = `
		#preloader{
			position: fixed;
			top: 50%; left: 50%;
			transform: translate(-50%, -50%);
		}
		.lds-dual-ring {
			display: inline-block;
			width: 80px; height: 80px;
		}
		.lds-dual-ring:after {
			content: ""; display: block;
			width: 64px; height: 64px;
			margin: 8px;
			border-radius: 50%;
			border: 6px solid #00B0FF;
			border-color: #00B0FF transparent #00B0FF transparent;
			animation: lds-dual-ring 1.2s linear infinite;
		}
		@keyframes lds-dual-ring {
		  0% { transform: rotate(0deg); }
		  100% { transform: rotate(360deg); }
		}
		`
	document.head.appendChild(el)
	document.body.innerHTML += `
		<div id="preloader">
			<div class="lds-dual-ring"></div>
		</div>`
})()

function loadApp(imports=``, htmls=``, scripts=``, theme_parser="storage"){
	themeEngine(theme_parser)
	languageEngine()

	window.addEventListener('lang-loaded', ()=>{
		build_page(htmls)
	})

	window.addEventListener('page-builded', ()=>{
		load_resources(scripts)
	})

	load_resources(imports)

	async function load_resources(what){
		let array = what.split('\n').map(e=>e.trim()).filter(n=>n);
		async function next(arr) {
			if (arr.length) {
				let el = parseHTML(arr.shift())
				if(el.hasAttribute("required")){
					await load_source(el)
				}
				else{
					load_source(el)
				}
				next(arr)
			}
		}
		next(array);
	}

	async function build_page(string){
		let array = string.split('\n').map(e=>e.trim()).filter(n=>n);
		for (let i in array){
			let el = parseHTML(array[i])
			let link = el.src || el.href;
			let string = await load_data(link)
			string = string.replace(/\${(.*?)\}/g, (match, contents)=>{ return eval(contents) })
			document.body.innerHTML += string
		}		
		setTimeout(function(){document.body.style.transition = "1s"}, 500)
		document.getElementById("preloader").style.display = "none"
		document.documentElement.setAttribute("ready", true)
		window.dispatchEvent(new Event('page-builded'));
	}
}

function parseHTML(html) {
	let temp = html.split("<").filter(n=>n)[0].split(" ")
	let elem = temp[0]
	let atrs = temp.slice(1,)
	atrs[atrs.length-1] = atrs[atrs.length-1].split(">")[0]

	let htmlEl = document.createElement(elem)
	atrs.forEach(atr=>{
		htmlEl.setAttributeNode(parseAtribute(atr))
	})
	return htmlEl;
}
function parseAtribute(string){
	let arr = string.split("=")
	let a = document.createAttribute(arr[0])
	if (arr.length > 1){
		a.value = arr[1].replace(/['"]+/g, '')
	}
	return a;
}
async function load_source(element){
	await new Promise((resolve, reject) => {
		let link = element.src || element.href;
		if (link.includes('fontawesome')){
			document.head.appendChild(element);
		}
		else{
			fetch(link)
				.then((response) => {
					if (response.ok) {
						load_this(response.blob())
					}
					else{
						console.log(`Reloading ${link}`)
						load_source(element)	
					}
				});
			async function load_this(dat){
				var data = await dat;
				var url = window.URL.createObjectURL(data);
				if (element.src){ element.src = url }
				else if (element.href){ element.href = url }
				document.head.appendChild(element)
				resolve()
			}
		}
	});
}


function themeEngine(from="storage"){
	function autoTheme(){
		let darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)").matches
		if (darkThemeMq) {
			theme = "dark"
			window.localStorage.setItem('theme', theme)
		}
	}

	let theme;
	if (from == "storage"){
		theme = window.localStorage.getItem('theme')
		if (!theme){
			autoTheme()
		}
	}

	theme = theme ? theme : 'light'
	document.documentElement.setAttribute("theme", theme)
	document.documentElement.classList.add(theme)
	window.dispatchEvent(new Event('theme-loaded'));
}

function try_dark(e){
	if (document.documentElement.getAttribute("theme") == "dark"){
		e.src = e.src.split('.').slice(0, -1).join('.') + "_dark.svg"
	}
	else{
		e.src = e.src.split('.').slice(0, -1).join('.').split("_dark")[0] + ".svg"
	}
}

async function load_data(link){
	return await new Promise((resolve) => {
		fetch(link).then(async (response) => {
			if (response.ok) {
				let data = await response.blob();
				let reader = new FileReader();
				reader.addEventListener("loadend", function(e){
					resolve(e.srcElement.result)
				});
				reader.readAsText(data);
			}
			else{
				console.log(`Reloading ${link}`)
				load_data(link)	
			}
		})
	});
}


var LANG;
async function languageEngine(){
	let lang = window.location.pathname.split("/").filter(e=>e)[0];
	var langs_path = `/${lang}/root_/Langs/`
	let url = `${langs_path + lang}.json`

	if (!(await ifFileExist(url))){
		lang = 'en';
		url = `${langs_path + lang}.json`
	}
	document.documentElement.setAttribute("lang", lang)
	LANG = await getTranslation(lang)
	window.dispatchEvent(new Event('lang-loaded'));

	async function getTranslation(lang){
		let language = await load_data(`${langs_path + lang}.json`)
		language = language.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,''); // remove comments
		language = language.replace(/\,(?=\s*?[\}\]])/g,''); // remove coma at the end of json
		language = JSON.parse(language);

		if (language.__root__?.inherit){
			let parrent_translate = await getTranslation(language.__root__.inherit)
			return {...parrent_translate, ...language}
		}
		return language
	}
}
function ifFileExist(src, max_retries=5, delay=500){
	let retry_count = 0;
	return new Promise((resolve)=>{
		let helper = async function(){
			const start = Date.now();
			let xhr = new XMLHttpRequest()
			xhr.open('HEAD', src, true)
			xhr.onload = function() {
				if (this.readyState === this.DONE) {
					if (xhr.status!=200){
						retry_count++;
						if (retry_count >= max_retries){
							resolve(false)
						}
						else{
							let interval = setInterval(()=>{
								let duration = Date.now() - start;
								if (duration > delay){
									clearInterval(interval)
									helper()
								}
							}, 10)
						}
					}
					else{ resolve(true) }
				}
			}
			xhr.send();
		}
		helper()
	})
}
