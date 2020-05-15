function checkAuth(){
	firebase.auth().onAuthStateChanged(function(user){
		if (user) {

			try {document.getElementById('uname-dom').innerHTML = "Loading..."}
			catch(error){}

			firebase.auth().currentUser.getIdToken().then(function(idToken) {
				let url = 'login-user-api'
				let data = {uToken: idToken}
				let postData = {method: 'POST', body: JSON.stringify(data),headers: {'Content-Type': 'application/json'}}
				fetch(url, postData)
				.then(response => response.json())
				.then(function(result){
					if (result.success == true) {
						if (result.registered) {
							document.getElementById('uname-dom').innerHTML = "Hello, " + result.name
						} else {
							try {
								document.getElementById('uname-dom').innerHTML = "Unregistered!"
								document.getElementById("notifications").innerHTML = "🔔 | Register your account"
								document.getElementById("notifications").setAttribute("href", "registration")
								document.getElementById("notifications").setAttribute("style", "color: red;")
							}
							catch(error){}
							if (window.location.href.split('/').pop() != 'registration') {
								window.location.replace('registration')
							}
						}
					}
					else {
						console.log(result.error)
						document.getElementById("notifications").innerHTML = "🔔 | What the fuck just happened....."
						document.getElementById("notifications").setAttribute("style", "color: pink;")
					}
				})
			})
			try {
				document.getElementById('uname-field').setAttribute("style", "display: block;")
				document.getElementById('login-field').setAttribute("style", "display: none;")
				
				document.getElementById('uname-field').setAttribute("style", "display: block;")
				document.getElementById('login-field').setAttribute("style", "display: none;")
			}
			catch(error) {}
			try {document.getElementById('uAuthMsg').setAttribute("style", "display: none;")}
			catch(error) {}
			try{document.getElementById('authField').setAttribute("style", "display: block;")}
			catch(error) {}
		}
		else {
			document.getElementById('uname-field').setAttribute("style", "display: none;")
			document.getElementById('login-field').setAttribute("style", "display: block;")
			document.getElementById('uname-dom').innerHTML = "Unregistered"
			try{document.getElementById('uAuthMsg').setAttribute("style", "display: block;")}
			catch(error) {}
			try{document.getElementById('authField').setAttribute("style", "display: none;")}
			catch(error) {}
		}
	})
}

checkAuth()


function signinwithgoogle(){
	var googleAuthProvider = new firebase.auth.GoogleAuthProvider()
	firebase.auth().signInWithPopup(googleAuthProvider)
		.then(function(data){
			console.log('User signed in...')
		})
		.catch(function(error){
			console.log(error)
		})
}

function signinwithfb(){
	var fbAuthProvider = new firebase.auth.FacebookAuthProvider()
	firebase.auth().signInWithPopup(fbAuthProvider)
		.then(function(data){
			console.log('User signed in...')
		})
		.catch(function(error){
			console.log(error)
		})
}

function signinwithemail(){
	const txtEmail = document.getElementById('fuid')
	const txtPassword = document.getElementById('fpwd')

	var email = txtEmail.value
	var pass = txtPassword.value
	var auth = firebase.auth()

	auth.signInWithEmailAndPassword(email, pass)
		.catch(e => console.log(e.message))
		.then(function(data){
			txtPassword.value = ''
			txtEmail.value = ''
		})
}

function signout(){
	firebase.auth().signOut()
	window.location.replace('home')
	// window.location.replace(window.location.href.split("?")[0])
}

try {
	var pwField = document.getElementById("fpwd");
	pwField.addEventListener("keyup", function(event) {
	if (event.keyCode === 13) {
		event.preventDefault()
		document.getElementById("blogin").click()
		}
	})
}
catch(error) {}
