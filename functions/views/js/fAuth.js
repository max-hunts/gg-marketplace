function checkAuth(){
	firebase.auth().onAuthStateChanged(function(user){
		if (user) {
			document.getElementById('uname-field').setAttribute("style", "display: block;")
			document.getElementById('login-field').setAttribute("style", "display: none;")
			document.getElementById('uname-dom').innerHTML = "Hello, " + user.displayName
			document.getElementById('uname-field').setAttribute("style", "display: block;")
			document.getElementById('login-field').setAttribute("style", "display: none;")
			try {document.getElementById('uAuthMsg').setAttribute("style", "display: none;")}
			catch(error) {console.log(error)}
			try{document.getElementById('npf').setAttribute("style", "display: block;")}
			catch(error) {console.log(error)}
		}
		else {
			document.getElementById('uname-field').setAttribute("style", "display: none;")
			document.getElementById('login-field').setAttribute("style", "display: block;")
			document.getElementById('uname-dom').innerHTML = "Unregistered"
			try{document.getElementById('uAuthMsg').setAttribute("style", "display: block;")}
			catch(error) {console.log(error)}
			try{document.getElementById('npf').setAttribute("style", "display: none;")}
			catch(error) {console.log(error)}
		}
	})
}

window.onload = function(){
	checkAuth()
}

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
		.then(function(){
			txtPassword.value = ''
			txtEmail.value = ''
		})


}

function signout(){
	firebase.auth().signOut()
}


var pwField = document.getElementById("fpwd");
pwField.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("blogin").click();
  }
});
