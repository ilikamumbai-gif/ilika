import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useCombos } from "../../context/ComboContext";
import { useProducts } from "../../context/ProductContext";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../../firebase/firebaseConfig";

const EditCombo = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { combos, updateCombo } = useCombos();
    const { products } = useProducts();
    const storage = getStorage(app);
    const [combo, setCombo] = useState(null);
    const [previewImages, setPreviewImages] = useState([]);

    /* LOAD COMBO */
    useEffect(() => {
        const existing = combos.find((c) => c.id === id);
        if (existing) {
         
            setCombo(existing);
            setPreviewImages((existing.images || []).filter(Boolean));
        }
    }, [id, combos]);

    if (!combo)
        return (
            <AdminLayout>
                <div>Loading...</div>
            </AdminLayout>
        );

    /* PRODUCT SELECT */
    const toggleProduct = (productId) => {
        setCombo((prev) => ({
            ...prev,
            productIds: prev.productIds?.includes(productId)
                ? prev.productIds.filter((p) => p !== productId)
                : [...(prev.productIds || []), productId],
        }));
    };

    /* IMAGE UPLOAD */
    const handleImageUpload = (files) => {
        const arr = Array.from(files);

        const updatedImages = [...(combo.images || []), ...arr];

        setCombo({
            ...combo,
            images: updatedImages
        });

        const previews = arr.map(file => URL.createObjectURL(file));

        setPreviewImages(prev => [...prev, ...previews]);
    };

    /* DRAG REORDER */
    const handleReorder = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        const updatedImages = [...combo.images];
        const updatedPreviews = [...previewImages];

        const [movedImage] = updatedImages.splice(fromIndex, 1);
        const [movedPreview] = updatedPreviews.splice(fromIndex, 1);

        updatedImages.splice(toIndex, 0, movedImage);
        updatedPreviews.splice(toIndex, 0, movedPreview);

        setCombo({ ...combo, images: updatedImages });
        setPreviewImages(updatedPreviews);
    };

    /* REMOVE IMAGE */
    const removeImage = (index) => {
        const updatedImages = combo.images.filter((_, i) => i !== index);
        const updatedPreviews = previewImages.filter((_, i) => i !== index);

        setCombo({ ...combo, images: updatedImages });
        setPreviewImages(updatedPreviews);
    };

    /* SUBMIT */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const uploadedUrls = [];

            for (const file of combo.images) {
                if (typeof file === "string") {
                    // Old image URL → keep it
                    uploadedUrls.push(file);
                } else {
                    // New image → upload
                    const imageRef = ref(
                        storage,
                        `combos/${crypto.randomUUID()}-${file.name}`
                    );

                    await uploadBytes(imageRef, file);
                    const url = await getDownloadURL(imageRef);

                    uploadedUrls.push(url);
                }
            }

            await updateCombo(id, {
                ...combo,
                price: Number(combo.price),
                mrp: combo.mrp ? Number(combo.mrp) : null,
                images: uploadedUrls, // ⭐ final clean URLs
            });

            navigate("/admin/combos");

        } catch (error) {
            console.error("UPDATE COMBO ERROR:", error);
        }
    };

    return (
        <AdminLayout>
            <h1 className="text-xl font-semibold mb-6">Edit Combo</h1>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

                {/* NAME */}
                <input
                    value={combo.name}
                    onChange={(e) =>
                        setCombo({ ...combo, name: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                />

                {/* PRICE */}
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="number"
                        value={combo.price}
                        onChange={(e) =>
                            setCombo({ ...combo, price: e.target.value })
                        }
                        className="border p-2 rounded"
                    />

                    <input
                        type="number"
                        value={combo.mrp || ""}
                        onChange={(e) =>
                            setCombo({ ...combo, mrp: e.target.value })
                        }
                        className="border p-2 rounded"
                    />
                </div>

                {/* PRODUCT SELECTOR */}
                <div className="border p-4 rounded">
                    <h3 className="font-semibold mb-3">Select Products</h3>

                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {products
                            .filter((p) => p.isActive !== false)
                            .map((product) => (
                                <label key={product.id} className="flex gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={combo.productIds?.includes(product.id)}
                                        onChange={() => toggleProduct(product.id)}
                                    />
                                    {product.name}
                                </label>
                            ))}
                    </div>
                </div>

                {/* FREE PRODUCT */}
                <div className="border p-4 rounded">
                    <h3 className="font-semibold mb-3">Free Product (Optional)</h3>

                    <select
                        value={combo.freeProductId || ""}
                        onChange={(e) =>
                            setCombo({ ...combo, freeProductId: e.target.value })
                        }
                        className="w-full border p-2 rounded"
                    >
                        <option value="">No Free Product</option>

                        {products
                            .filter((p) => p.isActive !== false)
                            .map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                    </select>
                </div>

                {/* IMAGE UPLOAD */}
                <div
                    className="border-2 border-dashed p-5 rounded-xl text-center cursor-pointer"
                    onClick={() =>
                        document.getElementById("editComboImageInput").click()
                    }
                >
                    <input
                        id="editComboImageInput"
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => handleImageUpload(e.target.files)}
                    />

                    <h3 className="font-semibold">
                        Upload Combo Images (Drag to Reorder)
                    </h3>
                </div>

                {/* IMAGE PREVIEW */}
                {previewImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                        {previewImages
                            .filter(img => typeof img === "string")
                            .map((img, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={img}
                                        className="h-24 w-full object-cover rounded border"
                                        alt="combo preview"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black text-white text-xs px-2 rounded opacity-0 group-hover:opacity-100"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                    </div>
                )}

                {/* STATUS */}
                <div className="border p-4 rounded bg-gray-50">
                    <label className="block font-medium mb-2">Combo Status</label>

                    <div className="flex gap-4">
                        <label className="flex gap-2">
                            <input
                                type="radio"
                                checked={combo.isActive === true}
                                onChange={() =>
                                    setCombo({ ...combo, isActive: true })
                                }
                            />
                            Active
                        </label>

                        <label className="flex gap-2">
                            <input
                                type="radio"
                                checked={combo.isActive === false}
                                onChange={() =>
                                    setCombo({ ...combo, isActive: false })
                                }
                            />
                            Inactive
                        </label>
                    </div>
                </div>

                <button className="bg-black text-white px-4 py-2 rounded">
                    Update Combo
                </button>

            </form>
        </AdminLayout>
    );
};

export default EditCombo;