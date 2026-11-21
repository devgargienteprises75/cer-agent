import cerModel from "../models/cer.model.js";
import decideCat from "../service/ai.service.js";

export async function uploadDataController(req, res) {
    const { 
        floor, 
        isNewProduct, 
        productCode,
        productName,
        salesPersonName,
        description,
        imageUrl
    } = req.body;

    const category = await decideCat({ description })

    const data = await cerModel.create({
        floor, 
        isNewProduct, 
        productCode,
        productName,
        salesPersonName,
        exitCategory: category.content,
        description,
        imageUrl
    })

    res.status(200).json({
        message: "Data save successfully",
        data
    })
}