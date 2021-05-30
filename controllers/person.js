const { response } = require('express');
// const { generateJWT } = require('../helpers/jwt');
// const Event = require('../models/Event');


const getFiles = async (req, res = response) => {
    // const events = await Event.find()
    //     .populate('user', 'name');

    res.json({
        ok: true,
        data: []
    });
};

const getFile = async (req, res = response) => {

    const { uid, name } = req;
    // const token = await generateJWT(uid, name);

    res.json({
        ok: true,
        data: 'get file',
        // token
    });
};

module.exports = {
    getFiles,
    getFile
}