const container = document.querySelector('.container')
const searchInput = document.getElementById('searchInput')
const searchBtn = document.getElementById('searchBtn')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')
const resetBtn = document.getElementById('resetBtn')

const baseURL = 'https://pokeapi.co/api/v2/pokemon'

const pageSetup = {
	size: 10,
	nextURL: null,
	prevURL: null,
	items: [],
	favs: loadFavoritesFromLocalStorage(),
}

const initialEndpoint = `${baseURL}?limit=${pageSetup.size}`

fetchPage(initialEndpoint)

container.addEventListener('click', (event) => {
	const card = event.target.closest('li')

	if (!card) return

	card.classList.toggle('fav')

	const pokemonName = card.querySelector('h2').innerText

	const pokemon = pageSetup.items.find(
		(pokemon) => pokemon.name === pokemonName
	)

	updatePokemon(pokemon)
})

nextBtn.addEventListener('click', () => {
	if (!pageSetup.nextURL) return

	fetchPage(pageSetup.nextURL)
})

prevBtn.addEventListener('click', () => {
	if (!pageSetup.prevURL) return

	fetchPage(pageSetup.prevURL)
})

searchBtn.addEventListener('click', () => {
	const pokemonName = searchInput.value.trim().toLowerCase()

	if (!pokemonName) return

	fetchPokemonByName(pokemonName)
})

resetBtn.addEventListener('click', () => {
	searchInput.value = ''
	fetchPage(initialEndpoint)
})

function fetchPage(url) {
	fetch(url)
		.then((res) => res.json())
		.then((data) => {
			pageSetup.nextURL = data.next
			pageSetup.prevURL = data.previous
			pageSetup.items = data.results.map((pokemon) => pokemon.url)

			fetchDetailsForAllPokemons()
		})
}

function fetchPokemonByName(name) {
	const endpoint = `${baseURL}/${name}`

	pageSetup.nextURL = null
	pageSetup.prevURL = null
	pageSetup.items = [endpoint]

	fetchDetailsForAllPokemons()
}

function fetchPokemon(url) {
	return fetch(url)
		.then(handleErrors)
		.then((res) => res.json())
		.then(({ name, sprites }) => {
			return { name, image: sprites.other.home.front_default }
		})
}

function fetchDetailsForAllPokemons() {
	Promise.all(pageSetup.items.map(fetchPokemon))
		.then((data) => {
			pageSetup.items = data

			renderPage()
		})
		.catch((err) => alert(err.message))
}

function handleErrors(response) {
	if (!response.ok) {
		const errorMessage =
			response.status === 404
				? 'Pokemon no encontrado'
				: 'Se ha producido un error con la solicitud'
		throw new Error(errorMessage)
	}

	return response
}

function renderPage() {
	container.innerHTML = ''
	pageSetup.items.forEach(renderPokemon)
}

function renderPokemon({ name, image }) {
	const card = document.createElement('li')

	card.classList.toggle(
		'fav',
		pageSetup.favs.some((favorite) => favorite.name === name)
	)

	const img = document.createElement('img')
	img.src = image

	const h2 = document.createElement('h2')
	h2.innerText = name

	card.append(img, h2)

	container.appendChild(card)
}

function updatePokemon(pokemon) {
	const pokemonAlreadyExists = pageSetup.favs.some(
		(favorite) => favorite.name === pokemon.name
	)

	pageSetup.favs = pokemonAlreadyExists
		? pageSetup.favs.filter(
				(favorite) => favorite.name !== pokemon.name
		  )
		: [...pageSetup.favs, pokemon]

	saveFavoritesToLocalStorage()
}

function saveFavoritesToLocalStorage() {
	localStorage.setItem('pokemons', JSON.stringify(pageSetup.favs))
}

function loadFavoritesFromLocalStorage() {
	return JSON.parse(localStorage.getItem('pokemons')) || []
}
