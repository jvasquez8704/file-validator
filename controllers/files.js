const { response } = require('express');
const { pool } = require('../database/connect');


const getFiles =  async (req, res = response) => {
    //const client = await dbConnection();
    const resulset = await pool.query('SELECT * FROM person');
    // const resulset = await pool.query('SELECT * FROM users');
    const people = resulset.rows;
    res.json({
        ok: true,
        data: people
    });
};

const getFile = async (req, res = response) => {
    const { fileId } = req.params;
    // GET /p?tagId=5
    // const { tagId } = req.query.tagId
    // const token = await generateJWT(uid, name);
    const resultSet = await pool.query('SELECT * from person WHERE id = $1', [fileId]);
    // const resultSet = await pool.query('SELECT * from users WHERE id = $1', [fileId]);

    if (!resultSet.rowCount) {
        return res.status(400).json({
            ok: false,
            mjs: 'Person does not exist in DB'
        });
    }
    
    res.json({
        ok: true,
        data: true,
        // token
    });
};

module.exports = {
    getFiles,
    getFile
}