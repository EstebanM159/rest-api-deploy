const express = require('express');
const crypto = require('node:crypto');
const movies = require('./movies.json');
const cors = require('cors');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');
const app = express();

app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:3333',
      'https://movies.com',
      'https://midu.dev'
    ];
    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    if (!origin) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }

}
));
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ message: 'hola mundo' });
});
// metodos normales : get/head/post
// metodos complejos: put/patch/delete

// CORS Pre-flight
// OPTIONS

// Todos los recursos que sean movies se identifican con /movies
app.get('/movies', (req, res) => {
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(movies);
});
// Borrar una pelicula
app.delete('/movies/:id', (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  movies.splice(movieIndex, 1);
  return res.json({ message: 'Movie deleted' });
});
// Obtener peliculas por ID
app.get('/movies/:id', (req, res) => {
  const { id } = req.params;
  const movie = movies.find(movie => movie.id === id);
  if (movie) return res.json(movie);

  res.status(404).json({ message: '404 movie not found' });
});
// Agregar pelicula
app.post('/movies', (req, res) => {
  // VALIDACIONES
  const result = validateMovie(req.body);
  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});
// Actualizar pelicula
app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body);
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' });
  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  };
  movies[movieIndex] = updateMovie;
  return res.json(updateMovie);
});

// El 404 default
app.use((req, res) => {
  res.status(404).send('<h1>404</h1>');
});
const PORT = process.env.PORT ?? 3333;
app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
