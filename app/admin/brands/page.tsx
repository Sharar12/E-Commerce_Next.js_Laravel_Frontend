"use client";

import { useEffect, useState } from "react";
import { apiUrl, adminToken, safeParseJson, getImageUrl } from "../../common/http";
import Link from "next/link";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import { Upload, Tag } from "lucide-react";

interface Brand {
  id: number;
  name: string;
  image?: string | null;
  status: number | string;
  created_at?: string;
  updated_at?: string;
}

export default function BrandList() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // View & Edit Modal States
  const [viewBrand, setViewBrand] = useState<Brand | null>(null);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${apiUrl}/brands`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`
        },
      });
      const data = await safeParseJson(res);
      setLoading(false);

      if (res.ok && data) {
        if (Array.isArray(data.data)) {
          setBrands(data.data);
        } else if (Array.isArray(data)) {
          setBrands(data);
        } else {
          setBrands([]);
        }
      } else {
        setBrands([]);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      setLoading(false);
      setBrands([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const res = await fetch(`${apiUrl}/brands/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken()}`,
        },
      });

      if (res.ok) {
        setBrands((prev) => prev.filter((b) => b.id !== id));
      } else {
        const err = await safeParseJson(res);
        alert("❌ Error deleting brand: " + (err.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting brand:", error);
      alert("Error deleting brand!");
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBrand) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("name", editBrand.name);
      formData.append("status", String(editBrand.status));
      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      const res = await fetch(`${apiUrl}/brands/${editBrand.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken()}`,
        },
        body: formData,
      });

      const result = await res.json();
      setSaving(false);

      if (res.ok && (result.status === 200 || result.data)) {
        const updated = result.data || editBrand;
        setBrands((prev) => prev.map((b) => (b.id === editBrand.id ? { ...b, ...updated } : b)));
        setEditBrand(null);
        setEditImageFile(null);
        setEditImagePreview(null);
      } else {
        alert("❌ Error updating brand: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating brand:", error);
      alert("Error updating brand!");
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">
        
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Brand Directory
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">
              Curated Brands
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
              />
            </div>
            <Link
              href="/admin/brands/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl"
            >
              <span>+ Add Brand</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Brands...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No brands found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredBrands.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="brands"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Logo</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedBrands.map((brand) => (
                    <tr
                      key={brand.id}
                      className="hover:bg-[#FFFDF9] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-[#8C6D2B]">#{brand.id}</td>
                      <td className="px-6 py-4">
                        {brand.image ? (
                          <img
                            src={getImageUrl(brand.image)}
                            alt={brand.name}
                            className="w-10 h-10 object-contain rounded-lg border border-[#E8E2D5] bg-[#FAF8F5] p-1"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-[#E8E2D5] bg-[#FAF8F5] flex items-center justify-center text-[#8C6D2B]">
                            <Tag className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-serif font-semibold text-[#1C1A17]">{brand.name}</td>
                      <td className="px-6 py-4">
                        {Number(brand.status) === 1 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewBrand(brand)}
                            className="p-1.5 rounded-lg border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all"
                            title="View Brand Details"
                          >
                            👁
                          </button>
                          <button
                            onClick={() => {
                              setEditBrand(brand);
                              setEditImageFile(null);
                              setEditImagePreview(null);
                            }}
                            className="p-1.5 rounded-lg border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all"
                            title="Edit Brand"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(brand.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all"
                            title="Delete Brand"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredBrands.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}

        {/* View Modal */}
        {viewBrand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Brand Record</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Brand #{viewBrand.id}</h3>
                </div>
                <button
                  onClick={() => setViewBrand(null)}
                  className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {viewBrand.image && (
                <div className="flex justify-center py-2">
                  <img
                    src={getImageUrl(viewBrand.image)}
                    alt={viewBrand.name}
                    className="w-24 h-24 object-contain rounded-xl border border-[#E8E2D5] bg-white p-2"
                  />
                </div>
              )}

              <div className="text-xs divide-y divide-[#E8E2D5]">
                {[
                  ["Brand Name", viewBrand.name],
                  ["Status", Number(viewBrand.status) === 1 ? "Active" : "Inactive"],
                  ["Registered Date", viewBrand.created_at ? new Date(viewBrand.created_at).toLocaleDateString() : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="py-2.5 flex justify-between">
                    <span className="text-[#8C6D2B] font-bold uppercase text-[10px]">{label}</span>
                    <span className="font-serif font-semibold text-[#1C1A17]">{val}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setViewBrand(null)}
                  className="w-full py-2.5 bg-[#1C1A17] text-white font-bold uppercase tracking-wider text-[11px] rounded-xl hover:bg-[#8C6D2B] transition-all"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editBrand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Brand Entry</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Brand #{editBrand.id}</h3>
                </div>
                <button
                  onClick={() => {
                    setEditBrand(null);
                    setEditImageFile(null);
                    setEditImagePreview(null);
                  }}
                  className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editBrand.name}
                    onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
                    className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]"
                  />
                </div>

                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Brand Logo / Thumbnail
                  </label>
                  <div className="flex items-center gap-3">
                    {(editImagePreview || editBrand.image) && (
                      <img
                        src={editImagePreview || getImageUrl(editBrand.image!)}
                        alt="Brand thumbnail"
                        className="w-14 h-14 object-contain rounded-lg border border-[#E8E2D5] bg-white p-1"
                      />
                    )}
                    <label className="flex-1 border border-dashed border-[#E8E2D5] hover:border-[#C5A059] bg-white p-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs text-[#8C6D2B] font-medium">
                      <Upload className="w-4 h-4" />
                      <span>{editImageFile ? editImageFile.name : "Upload New Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Publication Status
                  </label>
                  <select
                    value={Number(editBrand.status)}
                    onChange={(e) => setEditBrand({ ...editBrand, status: Number(e.target.value) })}
                    className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditBrand(null);
                      setEditImageFile(null);
                      setEditImagePreview(null);
                    }}
                    className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}