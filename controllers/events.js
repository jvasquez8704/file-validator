const { response } = require('express');
const { generateJWT } = require('../helpers/jwt');
const Event = require('../models/Event');


const getEvents = async (req, res = response) => {
    const events = await Event.find()
        .populate('user', 'name');

    res.json({
        ok: true,
        events
    });
};

const getEvent = async (req, res = response) => {

    const { uid, name } = req;
    const token = await generateJWT(uid, name);

    res.json({
        ok: true,
        payload: 'get event',
        token
    });
};

const createEvent = async (req, res = response) => {

    // const { uid, name } = req;
    // const token = await generateJWT(uid, name);

    const _event = Event(req.body);

    try {
        _event.user = req.uid;
        const event = await _event.save();

        res.status(201).json({
            ok: true,
            event
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            ok: false,
            payload: 'Comunicate con el administradors',
        });
    }
};

const updateEvent = async (req, res = response) => {

    const eventId = req.params.id;
    const uid = req.uid;
    try {
        const event = await Event.findById( eventId );

        console.log(event)

        if (!event) {
            res.status(404).json({
                ok: false,
                mjs: 'El evento no fue encontrado'
            });
        }

        if (event.user.toString() !== uid) {
            res.status(403).json({
                ok: false,
                mjs: 'No autorizado para realizar esta accion'
            });
        }

        const payload = {
            ...req.body,
            user: uid
        }
        const updatedEvent = await Event.findByIdAndUpdate(eventId, payload, { new: true });

        res.json({
            ok: true,
            event: updatedEvent
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mjs: 'Error, comuniquese con el administrador'
        });
    }
};

const deleteEvent = async (req, res = response) => {

    const eventId = req.params.id;
    const uid = req.uid;
    try {
        const event = await Event.findById( eventId );

        console.log(event)

        if (!event) {
            res.status(404).json({
                ok: false,
                mjs: 'El evento no fue encontrado'
            });
        }

        if (event.user.toString() !== uid) {
            res.status(403).json({
                ok: false,
                mjs: 'No autorizado para realizar esta accion'
            });
        }

        const deletedEvent = await Event.findByIdAndDelete(eventId);

        res.status(200).json({
            ok: true,
            event: deletedEvent
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mjs: 'Error, comuniquese con el administrador'
        });
    }

};

module.exports = {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
}