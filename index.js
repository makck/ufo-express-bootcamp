import express from 'express';
import methodOverride from 'method-override';
import { read, add, write } from './jsonFileStorage.js';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// Route to index page, renders a list of sightings in DB
app.get('/', (req, res) => {
  read('data.json', (readErr, content) => {
    const sortedObj = { sightings: [] };
    let sortedList = [];
    const userSortOrder = req.query.sortOrder;
    const userSortBy = req.query.sortBy;

    if (!readErr) {
      if (userSortOrder === 'asc') {
        sortedList = content.sightings.sort((a, b) => {
          if (a[userSortBy] < b[userSortBy]) {
            return -1;
          }
          if (a[userSortBy] > b[userSortBy]) {
            return 1;
          }
        });
        sortedObj.sightings = sortedList;
        res.render('index', sortedObj);
      }

      else if (userSortOrder === 'dsc') {
        sortedList = content.sightings.sort((a, b) => {
          if (b[userSortBy] < a[userSortBy]) {
            return -1;
          }
          if (b[userSortBy] > a[userSortBy]) {
            return 1;
          }
        });
        sortedObj.sightings = sortedList;
        res.render('index', sortedObj);
      }

      else {
        res.render('index', content);
      }
    }
  });
});

// Post user input details to DB
app.post('/sighting', (req, res) => {
  console.log(req.body);
  let isValid = true;

  Object.entries(req.body).forEach(([key, value]) => {
    if (value.length === 0) {
      isValid = false;
    }
  });

  if (!isValid) {
    res.render('failedEntry');
  }
  else {
    add('data.json', 'sightings', req.body, (err) => {
      if (err) {
        res.status(500).send('DB write error.');
        return;
      }
      res.redirect('/');
    });
  }
});

// Render form for new sighting input
app.get('/sighting', (req, res) => {
  res.render('addSighting');
});

// Route to render single sighting
app.get('/sighting/:index', (req, res) => {
  read('data.json', (readErr, content) => {
    if (!readErr) {
      const sightingIndex = req.params.index;
      res.render('singleSighting', { content, sightingIndex });
    }
  });
});

// Route to render form for DB entry edits, and to also show current data in the respective fields
app.get('/sighting/:index/edit', (req, res) => {
  read('data.json', (readErr, content) => {
    if (!readErr) {
      const { index } = req.params;
      const currentDetails = content.sightings[index];
      res.render('editSighting', { index, currentDetails });
    }
  });
});

// Route to edit data in DB based on user input
app.put('/sighting/:index/edit', (req, res) => {
  const { index } = req.params;
  read('data.json', (readErr, content) => {
    content.sightings[index] = req.body;
    write('data.json', content, (err) => {
      if (!err) {
        res.redirect(`/sighting/${index}`);
      }
    });
  });
});

// Route to render list of shapes
app.get('/shapes', (req, res) => {
  read('data.json', (readErr, content) => {
    if (!readErr) {
      res.render('shapeList', content);
    }
  });
});

// Route to render all sightings for a specified shape
app.get('/shapes/:shape', (req, res) => {
  read('data.json', (readErr, content) => {
    const specifiedShape = req.params.shape;
    if (!readErr) {
      res.render('sightingsPerShape', { content, specifiedShape });
    }
  });
});

// Route to delete sightings
app.delete('/sighting/:index/delete', (req, res) => {
  const { index } = req.params;

  read('data.json', (readErr, content) => {
    if (!readErr) {
      content.sightings.splice(index, 1);
      write('data.json', content, (err) => {
        if (!err) {
          res.redirect('/');
        }
      });
    }
  });
});

app.listen(3004);
