function setCookie(name, value, options = {}) {
	options = {path: '/', ...options};
	let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
	for (let optionKey in options) {
		updatedCookie += "; " + optionKey;
		let optionValue = options[optionKey];
		updatedCookie += "=" + optionValue;
	}
	document.cookie = updatedCookie;
}
// function deleteCookie(name){
// 	setCookie(name, "", {'max-age': -1})
// }

var canCopy = true;
function copyURL(el){
	if (canCopy){
		canCopy = false;
		const link = window.location.href
		const elem = document.createElement('textarea');
		elem.value = link;
		document.body.appendChild(elem);
		elem.select();
		document.execCommand('copy');
		document.body.removeChild(elem);
		let old_className = el.querySelector("i").className;
		el.querySelector("i").className = "fa-solid fa-check"
		el.querySelector("text").innerText = LANG.copied
		setTimeout(_=>{
			canCopy = true;
			el.querySelector("i").className = old_className
			el.querySelector("text").innerText = LANG.copy
		}, 1500)
	}
}

function openMenu(button){
	if (button.classList.contains("is-active")){
		document.querySelector("#main_menu").classList.add("open")
		window.dispatchEvent(new Event('menu_opened'));
	}
	else{
		document.querySelector("#main_menu").classList.remove("open")
		window.dispatchEvent(new Event('menu_closed'));
	}
}

document.querySelector("#main_menu").onclick = function(e){
	if (opened_fully && !swiping_menu){
		if (e.target == document.querySelector("#main_menu")){
			e.target.classList.remove("open")
			document.getElementById("hamburger").classList.remove("is-active")
			window.dispatchEvent(new Event('menu_closed'));
		}	
	}
}

document.querySelectorAll(".menu-area").forEach(menuArea =>{
	let back_button = menuArea.querySelector(".back_button")
	menuArea.querySelectorAll(".submenu").forEach(el=>{
		let back = document.createElement("li")
		back.classList.add("back_button")
		back.onclick = _=>{
			el.style.left = ""
			el.dispatchEvent(new Event('submenu_close'));
		}
		back.innerHTML = back_button.innerHTML;
		if (el.querySelector(".menu_title")){
			el.querySelector(".menu_title").after(back);
		}
		else{
			el.prepend(back)
		}
	})
	menuArea.querySelectorAll(".menu, .submenu").forEach(menu=>{
		menu.querySelectorAll("li[submenu]").forEach(sub=>{
			let target = menuArea.querySelector(`.submenu[name=${sub.getAttribute("submenu")}]`)
			sub.onclick = _=>{
				menu.style.filter = "brightness(0.25)"
				target.style.left = 0
			}
			target.addEventListener('submenu_close', _=> {
				menu.style.filter = ""
				target.style.left = ""
			});
		})
	})
})
function exitAllSubMenus(){
	document.querySelector("#popup_menu").querySelectorAll(".menu, .submenu").forEach(menu=>{
		menu.dispatchEvent(new Event('submenu_close'));
	})
}


function initSelectedMenuElement(li_name, html_atribute, change_handler){
	let main_el = document.querySelector(`#main_menu .menu li[submenu='${li_name}']`)
	let submenu = document.querySelector(`#main_menu .submenu[name='${li_name}']`)
	let selected = submenu.querySelector(`li[value="${html_atribute}"]`)
	main_el.innerHTML += `: <span class='helper'>${selected.innerText}</span>`
	selected.classList.add("selected")
	submenu.addEventListener("click", e=>{
		if (e.target.tagName.toLowerCase() == "li" &&
			!e.target.classList.contains('selected') && 
			!e.target.classList.contains('back_button')
		){
			let old_selected = submenu.querySelector("li.selected")
			old_selected.classList.remove("selected")
			e.target.classList.add("selected")
			change_handler(e.target, old_selected)
		}
	})
}
initSelectedMenuElement('language', document.documentElement.getAttribute("lang"), target=>{
	setCookie("lang", target.getAttribute("value"))
	let path = window.location.pathname.split("/").filter(e=>e);
	path[0] = target.getAttribute("value")
	window.location.pathname = path.join("/")
});
initSelectedMenuElement('theme', document.documentElement.getAttribute("theme"), (target, old_element)=>{
	window.localStorage.setItem('theme', target.getAttribute("value"))
	document.documentElement.setAttribute("theme", target.getAttribute("value"))
	document.documentElement.classList.remove(old_element.getAttribute("value"))
	document.documentElement.classList.add(target.getAttribute("value"))
	initMenuIcons()
});

function initMenuIcons(){
	document.querySelectorAll(".menu-area ul li > i[darkClass]").forEach(icon=>{
		if (document.documentElement.getAttribute("theme") == "light"){
			icon.classList.remove(icon.getAttribute("darkClass"))
			icon.classList.add(icon.getAttribute("lightClass"))
		}
		else{
			icon.classList.remove(icon.getAttribute("lightClass"))
			icon.classList.add(icon.getAttribute("darkClass"))
		}
	})
}
initMenuIcons()


var touchstartX = 0;
var diff = 40;
var moving_val = 0;
var opened_fully = false;
var swiping_menu = false;
window.addEventListener("menu_opened", _=>{
	opened_fully = true;
	diff = window.innerWidth;
})
window.addEventListener("menu_closed", _=>{
	opened_fully = false;
	diff = 40;
	document.getElementById("popup_menu").addEventListener("transitionend", _=>{
		if (!document.getElementById("main_menu").classList.contains("open")){
			exitAllSubMenus()
		}
	})
})
Array.from(["mousedown", "touchstart"]).forEach( evt => {
	document.addEventListener(evt,event=>{
		touchstartX = event.clientX || event.touches[0].clientX;
		if (window.innerWidth - touchstartX <= diff){
			Array.from(["mousemove", "touchmove"]).forEach( evt2 => {
				document.addEventListener(evt2, movingHandler);
			})
		}
	})
})
Array.from(["mouseup", "touchend"]).forEach( evt => {
	document.addEventListener(evt,event=>{
		Array.from(["mousemove", "touchmove"]).forEach( evt2 => {
			document.removeEventListener(evt2, movingHandler);
		})
		swiping_menu = false;

		document.getElementById("popup_menu").style.transition = ""
		document.getElementById("main_menu").style.cursor = ""
		document.getElementById("popup_menu").style.right = ""
		document.getElementById("main_menu").style.transition = ""
		document.getElementById("main_menu").style.background = ""
		document.getElementById("popup_menu").addEventListener("transitionend", _=>{
			document.getElementById("main_menu").style.zIndex = ""
		})
		
		if (document.getElementById("main_menu").classList.contains("open")){
			window.dispatchEvent(new Event('menu_opened'));
		}
		else{
			window.dispatchEvent(new Event('menu_closed'));
		}
	})
})
function movingHandler(event){
	let position = event.clientX || event.touches[0].clientX;
	swiping_menu = true;
	moving_val = touchstartX - position;
	if (opened_fully){
		moving_val = Math.min(350, Math.max(0, 350 + moving_val))
	}

	document.getElementById("main_menu").style.zIndex = "1"
	document.getElementById("main_menu").style.cursor = "ew-resize"
	document.getElementById("popup_menu").style.transition = "0s"
	document.getElementById("popup_menu").style.right = `calc((max(25%, 350px) - min(350px, ${moving_val}px)) * -1)`
	let filter_val = Math.max(0, Math.min(moving_val / 350, 1)) / 2;
	document.getElementById("main_menu").style.transition = "0s"
	document.getElementById("main_menu").style.background = `rgb(0, 0, 0, ${filter_val})`

	if (!opened_fully){
		if (moving_val > 350 / 4){
			document.getElementById("main_menu").classList.add("open")
			document.getElementById("hamburger").classList.add("is-active")
		}
		else{
			document.getElementById("main_menu").classList.remove("open")
			document.getElementById("hamburger").classList.remove("is-active")
		}
	}
	else{
		if ((350 - moving_val) > 350 / 4){
			document.getElementById("main_menu").classList.remove("open")
			document.getElementById("hamburger").classList.remove("is-active")
		}
		else{
			document.getElementById("main_menu").classList.add("open")
			document.getElementById("hamburger").classList.add("is-active")
		}
	}
}