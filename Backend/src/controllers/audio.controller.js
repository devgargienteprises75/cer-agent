import cerModel from "../models/cer.model.js";
import decideCat from "../service/ai.service.js";
import { deleteImage, uploadImage } from "../service/saveImages.js";

export async function uploadDataController(req, res) {
    const formFields = req.body ?? {}
    let jsonFields = {}

    if (formFields.data !== undefined) {
        try {
            jsonFields = typeof formFields.data === 'string'
                ? JSON.parse(formFields.data)
                : formFields.data
        } catch {
            return res.status(400).json({ message: 'The "data" form field must contain valid JSON' })
        }

        if (!jsonFields || typeof jsonFields !== 'object' || Array.isArray(jsonFields)) {
            return res.status(400).json({ message: 'The "data" form field must contain a JSON object' })
        }
    }

    const fields = { ...jsonFields, ...formFields }
    const {
        floor,
        isNewProduct,
        productCode,
        productName,
        salesPersonName,
        description,
    } = fields

    if (!req.file) {
        return res.status(400).json({ message: 'An image file is required in the "image" field' })
    }
    const parsedFloor = Number(floor)
    if (![-1, 0, 1, 2, 3].includes(parsedFloor) || !Number.isInteger(parsedFloor)) {
        return res.status(400).json({ message: 'floor must be one of -1, 0, 1, 2, or 3' })
    }
    if (!salesPersonName?.trim() || !description?.trim()) {
        return res.status(400).json({ message: 'salesPersonName and description are required' })
    }

    let driveFile
    let stage = 'category'
    try {
        const category = await decideCat({ description })
        stage = 'google_drive_upload'
        driveFile = await uploadImage(req.file)

        stage = 'database_save'
        const data = await cerModel.create({
            floor: parsedFloor,
            isNewProduct,
            productCode,
            productName,
            salesPersonName,
            exitCategory: category.content,
            description,
            imageUrl: driveFile.url,
            imageDriveFileId: driveFile.id
        })

        return res.status(201).json({
            message: 'Data saved successfully',
            data
        })
    } catch (error) {
        if (driveFile?.id) {
            try {
                await deleteImage(driveFile.id)
            } catch (cleanupError) {
                console.error('Could not remove orphaned Drive upload:', cleanupError.message)
            }
        }

        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: error.message })
        }

        const details = error.response?.data?.error?.message || error.message
        console.error(`Could not complete ${stage}:`, details)
        return res.status(stage === 'google_drive_upload' ? 502 : 500).json({
            message: stage === 'google_drive_upload'
                ? 'Google Drive rejected the image upload'
                : 'Could not save the record and image',
            details
        })
    }
}
