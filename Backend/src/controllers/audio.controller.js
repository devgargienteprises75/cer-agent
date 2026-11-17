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
    console.log(category.content)
}