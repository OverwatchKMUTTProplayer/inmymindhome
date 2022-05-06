import dbConnect from '../../lib/db.js'
import TutorTask from '../../models/TutorTask.js'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { makeSheetPivot, appendToSheet } from '../../lib/sheet.js'

const ajv = new Ajv({ allErrors:true })


ajv.addFormat('phonenumber', /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/)

addFormats(ajv)

const schema = {
  type: 'object',
  properties: {
    fname: { type: 'string', minLength: 1 },
    lname: { type: 'string', minLength: 1 },
    subjects: { type: 'string', minLength: 2 },
    gender: { type: 'string', minLength: 1 },
    level: { type: 'string', minLength: 2 },
    purpose: { type: 'string', minLength: 2 },
    time: { type: 'string', minLength: 2 },
    date: { type: 'string', minLength: 2 },
    way: { type: 'string', minLength: 2 },
    price: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', format: 'phonenumber', minLength: 9, maxLength: 13 },
    detail: { type: 'string', default: '-' }
  },
  required: ['fname','lname','subjects','gender','level','purpose','time','date','way','price','email','phone','detail']
}

const validate = ajv.compile(schema)

export default async function handler(req, res) {
  try{
    if (req.method == 'POST'){
      await dbConnect()
      const valid = validate(req.body)
      if (!valid){
        res.status(400).json({success: false, message:'Invalid request.', errors: validate.errors})
      }else{
        req.body.phone = req.body.phone.split("-|(|)|+").join("")

        const newTask = {
          firstname: req.body.fname,
          lastname: req.body.lname,
          gender: req.body.gender,
          email: req.body.email,
          phone: req.body.phone,
          subjects: req.body.subjects,
          level: req.body.level,
          purpose: req.body.purpose,
          time: req.body.time,
          date: req.body.date,
          way: req.body.way,
          price: req.body.price,
          detail: req.body.detail
        }
        
        const a = await TutorTask.create( newTask )
        newTask.createdAt = a.createdAt
        newTask.id = a._id
        const sheetarr = Object.values(newTask)
        appendToSheet(process.env.SHEETID,`tutor!A2:${sheetarr.length}`,Object.values(sheetarr))
        res.status(200).json({ success: true, data: newTask })

        
      }

    }else{
      res.status(405).json({success: false, message:`Cannot ${req.method}`})
    }
  }catch(e){
    console.error(e)
    res.status(500).json({success: false, message:`Internal Server Error.`})
  }
  

}
