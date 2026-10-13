const mongoose = require('mongoose');
const listing=require('./listing-model.js')
const sampleListings = require('../data.js');

// const main = async () => {
//     await mongoose.connect(`mongodb://127.0.0.1:27017/airbnb`);
// }
// main()
//     .then(() => console.log("connected"))
//     .catch((e) => console.log(e));

const add=async () => {
    await listing.deleteMany({});
    const data = sampleListings.map((obj)=>({...obj , owner: '69cbc902f75bf7492a620123'}))
    await listing.insertMany(data);
    console.log("data was reinitiallized!")
}
add();

