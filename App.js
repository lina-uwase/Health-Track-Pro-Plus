const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 300;

const db = new sqlite3.Database('healthTrack');

app.use(express.json());
db.run('create table if not exists data(' +
    ' patient_id INTEGER PRIMARY KEY,' +
    'patient_name Text UNIQUE,' +  
    'patient_nid Text UNIQUE,' +    
    'patient_temp REAL,' +
    'patient_frequent_sickness TEXT,' +
    'recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP' +
    ')', (err) => {
        if (!err) {
            console.log("table created successfully");
        } else {
            console.log("error creating table: ", err);
        }
    });

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})

// Middleware to validate NID with spaces as a 16-digit number and check for duplicates

const validateNID = (req, res, next) => {
    const { patient_nid } = req.body;

    // Remove non-digit characters

    const nidWithoutSpaces = patient_nid.replace(/\D/g, '');

    if (nidWithoutSpaces.length !== 16) {
        return res.status(400).json({ error: "NID must be a 16-digit number" });
    }
    next();
};

const checkDuplicateNID = (req, res, next) => {
    const { patient_nid } = req.body;

    // Check if the NID already exists in the database

    db.get('SELECT * FROM data WHERE patient_nid = ?', [patient_nid], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: "A patient with the same NID already exists" });
        }
        next();
    });
};

// Add the middleware to the route where you want to validate NID

app.post('/api/data', checkDuplicateNID, (req, res) => {
    const { patient_name, patient_nid, patient_temp, patient_frequent_sickness } = req.body;
    db.run(
      'INSERT INTO data(patient_name, patient_nid, patient_temp, patient_frequent_sickness) VALUES (?, ?, ?, ?)',
      [patient_name, patient_nid, patient_temp, patient_frequent_sickness],
      function (err) {
        if (err) {
          return res.status(400).json({ error: "A patient with the same name or NID already exists" });
        }
        res.json({ id: this.lastID });
      }
    );
});

// Middleware to check for duplicate names

const checkDuplicateName = (req, res, next) => {
    const { patient_name } = req.body;
    db.get('SELECT * FROM data WHERE patient_name = ?', [patient_name], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: "A patient with the same name already exists" });
        }
        next();
    });
};

app.post('/api/data', validateNID,checkDuplicateNID, checkDuplicateName, (req, res) => {
    const { patient_name, patient_nid, patient_temp, patient_frequent_sickness } = req.body;
    db.run(
      'INSERT INTO data(patient_name, patient_nid, patient_temp, patient_frequent_sickness) VALUES (?, ?, ?, ?)',
      [patient_name, patient_nid, patient_temp, patient_frequent_sickness],
      function (err) {
        if (err) {
          return res.status(400).json({ error: "A patient with the same name or NID already exists" });
        }
        res.json({ id: this.lastID });
      }
    );
});

app.get('/', (req, res) => {
    res.send('welcome to Health tracking system');
})


//Get all patients data

app.get('/api/data', (req, res) => {
    db.all('select * from data', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });

        }
        res.json(rows);
    });

});

//get patients data by id

app.get('/api/data/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM data WHERE patient_id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});
//update patient data

app.put('/api/data/:id', (req, res) => {
    const id = req.params.id;
    const { patient_name, patient_nid, patient_temp, patient_frequent_sickness } = req.body;
    db.run(
        'UPDATE data SET patient_name = ?, patient_nid = ?, patient_temp = ?, patient_frequent_sickness = ? WHERE patient_id = ?',
        [patient_name, patient_nid, patient_temp, patient_frequent_sickness, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ changes: this.changes });
        }
    );
});
//delete all patients

app.delete('/api/data', (req, res) => {
    db.run('DELETE FROM data', function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log("All users were deleted successfully");
        res.json({ deleted: this.changes });
    });
});

//delete patient by id

app.delete('/api/data/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM data WHERE patient_id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log("User with ID " + id + " was deleted successfully");
        res.json({ deleted: this.changes });
    });
});

