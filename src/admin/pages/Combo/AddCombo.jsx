import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useProducts } from "../../context/ProductContext";
import { useCombos } from "../../context/ComboContext";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../../firebase/firebaseConfig";

const AddCombo = () => {
    const { products } = useProducts();
    const { addCombo } = useCombos();
    const storage = getStorage(app);
    const [previewImages, setPreviewImages] = useState([]);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        price: "",
        mrp: "",
        productIds: [],
        freeProductId: "",   // ⭐ NEW
        images: [],
        isActive: true,
    });

    const handleReorder = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        const updatedImages = [...form.images];
        const updatedPreviews = [...previewImages];

        const [movedImage] = updatedImages.splice(fromIndex, 1);
        const [movedPreview] = updatedPreviews.splice(fromIndex, 1);

        updatedImages.splice(toIndex, 0, movedImage);
        updatedPreviews.splice(toIndex, 0, movedPreview);

        setForm({ ...form, images: updatedImages });
        setPreviewImages(updatedPreviews);
    };

    const removeImage = (index) => {
        const updatedImages = form.images.filter((_, i) => i !== index);
        const updatedPreviews = previewImages.filter((_, i) => i !== index);

        setForm({ ...form, images: updatedImages });
        setPreviewImages(updatedPreviews);
    };

    const toggleProduct = (id) => {
        setForm(prev => ({
            ...prev,
            productIds: prev.productIds.includes(id)
                ? prev.productIds.filter(p => p !== id)
                : [...prev.productIds, id]
        }));
    };

    const handleImageUpload = (files) => {
        const arr = Array.from(files);

        const updatedImages = [...form.images, ...arr];

        setForm({
            ...form,
            images: updatedImages
        });

        const previews = arr.map(file =>
            URL.createObjectURL(file)
        );

        setPreviewImages(prev => [...prev, ...previews]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const uploadedUrls = [];

            for (const file of form.images) {
                if (typeof file === "string") {
                    // already URL (just in case)
                    uploadedUrls.push(file);
                } else {
                    const imageRef = ref(
                        storage,
                        `combos/${crypto.randomUUID()}-${file.name}`
                    );

                    await uploadBytes(imageRef, file);
                    const url = await getDownloadURL(imageRef);

                    uploadedUrls.push(url);
                }
            }

            await addCombo({
                ...form,
                price: Number(form.price),
                mrp: form.mrp ? Number(form.mrp) : null,
                images: uploadedUrls,  // ⭐ store URLs only
            });

            navigate("/admin/combos");

        } catch (error) {
            console.error("COMBO UPLOAD ERROR:", error);
        }
    };

    return (
        <AdminLayout>
            <h1 className="text-xl font-semibold mb-6">Add Combo</h1>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

                {/* NAME */}
                <input
                    placeholder="Combo Name"
                    value={form.name}
                    onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                    required
                />

                {/* PRICE */}
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="number"
                        placeholder="Price"
                        value={form.price}
                        onChange={(e) =>
                            setForm({ ...form, price: e.target.value })
                        }
                        className="border p-2 rounded"
                        required
                    />

                    <input
                        type="number"
                        placeholder="MRP"
                        value={form.mrp}
                        onChange={(e) =>
                            setForm({ ...form, mrp: e.target.value })
                        }
                        className="border p-2 rounded"
                    />
                </div>

                {/* PRODUCT SELECTOR */}
                <div className="border p-4 rounded">
                    <h3 className="font-semibold mb-3">Select Products</h3>

                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {products
                            .filter(p => p.isActive !== false)
                            .map(product => (
                                <label key={product.id} className="flex gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.productIds.includes(product.id)}
                                        onChange={() => toggleProduct(product.id)}
                                    />
                                    {product.name}
                                </label>
                            ))}
                    </div>
                </div>

                {/* FREE PRODUCT SELECTOR */}
                <div className="border p-4 rounded">
                    <h3 className="font-semibold mb-3">Free Product (Optional)</h3>

                    <select
                        value={form.freeProductId}
                        onChange={(e) =>
                            setForm({ ...form, freeProductId: e.target.value })
                        }
                        className="w-full border p-2 rounded"
                    >
                        <option value="">No Free Product</option>

                        {products
                            .filter(p => p.isActive !== false)
                            .map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                    </select>

                    {/* FREE PRODUCT PREVIEW */}
                    {form.freeProductId && (
                        <div className="mt-3 p-3 border rounded bg-gray-50">
                            {(() => {
                                const selected = products.find(
                                    p => p.id === form.freeProductId
                                );

                                if (!selected) return null;

                                return (
                                    <div className="flex items-center gap-3">
                                        {selected.images?.[0] && (
                                            <img
                                                src={selected.images[0]}
                                                className="w-16 h-16 object-cover rounded border"
                                            />
                                        )}
                                        <div>
                                            <p className="font-medium">{selected.name}</p>
                                            <p className="text-sm text-gray-500">
                                                ₹{selected.price}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* IMAGE UPLOAD */}
                <div
                    className="border-2 border-dashed p-5 rounded-xl text-center cursor-pointer"
                    onClick={() => document.getElementById("comboImageInput").click()}
                >
                    <input
                        id="comboImageInput"
                        type="file"
                        multiple
                        accept="image/*"
                        hidden
                        onChange={(e) => handleImageUpload(e.target.files)}
                    />

                    <h3 className="font-semibold">
                        Upload Combo Images (Drag to Reorder)
                    </h3>
                </div>

                {previewImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                        {previewImages.map((img, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) =>
                                    e.dataTransfer.setData("dragIndex", index)
                                }
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    const fromIndex = Number(
                                        e.dataTransfer.getData("dragIndex")
                                    );
                                    handleReorder(fromIndex, index);
                                }}
                                className="relative cursor-move group"
                            >
                                <img
                                    src={
                                        typeof img === "string"
                                            ? img
                                            : URL.createObjectURL(img)
                                    }
                                    className="h-24 w-full object-cover rounded border"
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
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={form.isActive === true}
                                onChange={() =>
                                    setForm({ ...form, isActive: true })
                                }
                            />
                            Active
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={form.isActive === false}
                                onChange={() =>
                                    setForm({ ...form, isActive: false })
                                }
                            />
                            Inactive
                        </label>
                    </div>
                </div>

                <button className="bg-black text-white px-4 py-2 rounded">
                    Save Combo
                </button>
            </form>
        </AdminLayout>
    );
};

export default AddCombo;