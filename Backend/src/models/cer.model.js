import mongoose from 'mongoose'

const cerSchema = new mongoose.Schema({
    date: {
        type: String,
        default: Date.now()
    },
    floor: {
        type: Number,
        required: true,
        enum: [-1, 0, 1, 2, 3]
    },
    isNewProduct: {
        type: Boolean,
        default: false
    },
    productCode: {
        type: String,
    },
    productName: {
        type: String,
    },
    salesPersonName: {
        type: String,
        required: true
    },
    exitCategory: {
        type: String,
        // required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    },
    imageDriveFileId: {
        type: String
    }
})

const cerModel = mongoose.model('cer', cerSchema);

export default cerModel;
