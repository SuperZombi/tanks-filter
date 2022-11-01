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

function openMenu(button){
	if (button.classList.contains("is-active")){
		document.querySelector("#main_menu").classList.add("open")
	}
	else{
		document.querySelector("#main_menu").classList.remove("open")
		exitAllSubMenus()
	}
}

document.querySelector("#main_menu").onclick = function(e){
	if (e.target == document.querySelector("#main_menu")){
		e.target.classList.remove("open")
		document.getElementById("hamburger").classList.remove("is-active")
		exitAllSubMenus()
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