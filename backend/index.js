require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

console.log('')

app.use(cors())
app.use(express.json())

morgan.token('type', (req) => {
  return JSON.stringify(req.body)
})

app.use(morgan(':method :url :status - :response-time ms :type'))
app.use(express.static('dist'))

app.get('/', (req, res) => {
  res.send('<h1>Bulaga!</h1>')
})

// info numbers for phonebook persons
app.get('/info', (req, res) => {
  const date = new Date()

  Person.find({}).then((person) => {
    res.send(`<div>
    <p>Phonebook has info for ${person.length} people</p>
    <p>${date.toString()}</p>
    </div>`)
  })
})

// get all phonebook persons
app.get('/api/persons', (req, res) => {
  Person.find({}).then((person) => {
    res.json(person)
  })
})

// get single phonebook person
app.get('/api/persons/:id', (req, res, next) => {
  const id = req.params.id

  Person.findById(id)
    .then((person) => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => {
      next(error)
    })
})

// delete single phonebook person
app.delete('/api/persons/:id', (req, res, next) => {
  const id = req.params.id

  Person.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})

// create single phonebook person
app.post('/api/persons', (req, res, next) => {
  const body = req.body

  // not accepting missing inputs
  if (!body.name || !body.number) {
    return res.status(400).json({
      error: 'missing input',
    })
  }

  Person.findOne({ name: body.name }).then((existingPerson) => {
    if (existingPerson) {
      return res.status(400).json({ error: 'name must be unique' })
    }

    const newPerson = new Person({
      name: body.name,
      number: body.number,
    })

    newPerson
      .save()
      .then((savedPerson) => {
        res.json(savedPerson)
      })
      .catch((error) => next(error))
  })
})

app.put('/api/persons/:id', (req, res, next) => {
  const { number } = req.body
  const id = req.params.id

  Person.findById(id)
    .then((person) => {
      if (!person) {
        return res.status(404).end()
      }

      person.number = number

      return person.save().then((updatedPerson) => {
        res.json(updatedPerson)
      })
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown enpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
