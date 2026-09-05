"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, Layers } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Pagination from "../components/Pagination";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status: number;
  level: number;
  parent_id: number | null;
  image?: string;
  created_at: string;
  children?: AdminCategory[];
  products_count?: number;
}

type LevelFilter = "all" | "1" | "2" | "3";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");
  return `${baseUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

function LevelBadge({ level }: { level: number }) {
  if (level === 1) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1C1A17] text-white border border-[#1C1A17]">
        Level 1 — Main Category
      </span>
    );
  }
  if (level === 2) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#C5A059] text-[#8C6D2B] bg-[#C5A059]/10">
        Level 2 — Sub-Category
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#6E685E] text-[#6E685E] bg-transparent">
      Child Category
    </span>
  );
}

import {
  useGetAdminCategoriesQuery,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../../services/categoryApi";

// ─── Component ─────────────────────────────────────────────────────────────────

function CategoriesContent() {
  const searchParams = useSearchParams();
  const { data: response, isLoading: loader } = useGetAdminCategoriesQuery();
  const tree = (response?.data as unknown as AdminCategory[]) || [];
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  useEffect(() => {
    const lvl = searchParams.get("level");
    if (lvl === "1" || lvl === "2" || lvl === "3") {
      setLevelFilter(lvl);
    } else {
      setLevelFilter("all");
    }
  }, [searchParams]);

  // Set of expanded Level-1 category IDs
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Edit / View modal states
  const [editCategory, setEditCategory] = useState<AdminCategory | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (cat: AdminCategory) => {
    // Count children
    const subCount = cat.children?.length || 0;
    const childCount =
      cat.children?.reduce((acc, sub) => acc + (sub.children?.length || 0), 0) || 0;

    let warning = `Are you sure you want to delete "${cat.name}"?`;
    if (subCount > 0 || childCount > 0) {
      warning += `\n\n⚠️ This will also delete ${subCount} sub-categor${subCount === 1 ? "y" : "ies"} and ${childCount} child categor${childCount === 1 ? "y" : "ies"}.`;
    }
    if (!confirm(warning)) return;

    try {
      await deleteCategory(cat.id).unwrap();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error deleting category!");
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", editCategory.name);
      formData.append("description", editCategory.description || "");
      formData.append("status", String(editCategory.status));
      formData.append("_method", "PUT");
      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      await updateCategory({ id: editCategory.id, body: formData }).unwrap();
      setEditCategory(null);
      setEditImageFile(null);
      setEditImagePreview(null);
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  // ── Flatten for search / level filter ─────────────────────────────────────

  // Flatten tree to a list of { cat, level } for filtering
  type FlatRow = { cat: AdminCategory; level: 1 | 2 | 3; parentId: number | null; grandParentId: number | null };

  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    tree.forEach((l1) => {
      rows.push({ cat: l1, level: 1, parentId: null, grandParentId: null });
      (l1.children || []).forEach((l2) => {
        rows.push({ cat: l2, level: 2, parentId: l1.id, grandParentId: null });
        (l2.children || []).forEach((l3) => {
          rows.push({ cat: l3, level: 3, parentId: l2.id, grandParentId: l1.id });
        });
      });
    });
    return rows;
  }, [tree]);

  const q = search.trim().toLowerCase();

  // When searching, collect IDs that match — then find ancestor level-1 IDs to auto-expand
  const matchingIds = useMemo(() => {
    if (!q) return null;
    return new Set(
      flatRows
        .filter((r) => r.cat.name.toLowerCase().includes(q))
        .map((r) => r.cat.id)
    );
  }, [q, flatRows]);

  const expandedForSearch = useMemo(() => {
    if (!matchingIds) return expanded;
    const ids = new Set(expanded);
    flatRows.forEach((r) => {
      if (matchingIds.has(r.cat.id)) {
        if (r.grandParentId) ids.add(r.grandParentId);
        if (r.parentId) ids.add(r.parentId);
      }
    });
    return ids;
  }, [matchingIds, flatRows, expanded]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Total count for stats
  const totalL1 = tree.length;
  const totalL2 = tree.reduce((a, c) => a + (c.children?.length || 0), 0);
  const totalL3 = tree.reduce(
    (a, c) => a + (c.children || []).reduce((b, s) => b + (s.children?.length || 0), 0),
    0
  );

  // ── Row renderer ──────────────────────────────────────────────────────────

  const renderRow = (cat: AdminCategory, level: 1 | 2 | 3, parentId?: number): React.ReactNode => {
    const isExpanded = expandedForSearch.has(cat.id);
    const hasChildren = (cat.children?.length || 0) > 0;
    const isVisible =
      levelFilter === "all" || levelFilter === String(level);
    const matchesSearch = !q || cat.name.toLowerCase().includes(q);

    // Determine row visibility based on search and level filters
    if (levelFilter !== "all" && String(level) !== levelFilter) {
      // If row isn't the target level, check if it's an ancestor needed to display target level items
      const hasTargetInTree =
        level === 1 &&
        (cat.children || []).some((sub) =>
          levelFilter === "2"
            ? true
            : (sub.children || []).some(() => levelFilter === "3")
        );
      const hasTargetInL2Tree =
        level === 2 &&
        levelFilter === "3" &&
        (cat.children || []).length > 0;

      if (!hasTargetInTree && !hasTargetInL2Tree) {
        return null;
      }
    }

    // When searching, show any row that matches OR is an ancestor of a match
    const ancestorOfMatch =
      q && (cat.children || []).some(
        (sub) =>
          (matchingIds?.has(sub.id) || false) ||
          (sub.children || []).some((ch) => matchingIds?.has(ch.id) || false)
      );

    if (!matchesSearch && !ancestorOfMatch && q) return null;

    const indent = level === 2 ? "pl-10" : level === 3 ? "pl-20" : "";
    const borderLeft =
      level === 2
        ? "border-l-2 border-[#E8E2D5] ml-6"
        : level === 3
        ? "border-l-2 border-[#E8E2D5] ml-12"
        : "";

    return (
      <React.Fragment key={cat.id}>
        <tr
          className={`${
            level === 1
              ? "bg-[#FFFDF9] hover:bg-[#FAF8F5]"
              : level === 2
              ? "bg-white hover:bg-[#FFFDF9]"
              : "bg-[#FAF8F5]/50 hover:bg-[#FAF8F5]"
          } transition-colors border-b border-[#E8E2D5]`}
        >
          {/* Expand + Level badge + Name */}
          <td className={`px-4 py-3 ${indent}`}>
            <div className={`flex items-center gap-2 ${borderLeft}`}>
              {(level === 1 || level === 2) && (
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="p-1 rounded-md hover:bg-[#E8E2D5] transition-colors flex-shrink-0"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#8C6D2B]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#8C6D2B]" />
                    )
                  ) : (
                    <span className="w-3.5 h-3.5 block" />
                  )}
                </button>
              )}
              {level === 3 && <span className="text-[#9E988D] text-xs mr-1">└──</span>}
              <LevelBadge level={level} />
            </div>
          </td>

          {/* Thumbnail */}
          <td className="px-4 py-3">
            {cat.image ? (
              <img
                src={getImageUrl(cat.image)!}
                alt={cat.name}
                className="w-9 h-9 rounded-lg object-cover border border-[#E8E2D5]"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#9E988D] text-[9px] font-bold">
                N/A
              </div>
            )}
          </td>

          {/* Name & Nested Counts */}
          <td className="px-4 py-3 font-serif font-semibold text-[#1C1A17] text-sm max-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{cat.name}</span>
              {level === 1 && (
                <>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]">
                    {(cat.children || []).length} Sub
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FAF8F5] border border-[#6E685E]/40 text-[#6E685E]">
                    {(cat.children || []).reduce((acc, sub) => acc + (sub.children || []).length, 0)} Child
                  </span>
                </>
              )}
              {level === 2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FAF8F5] border border-[#6E685E]/40 text-[#6E685E]">
                  {(cat.children || []).length} Child
                </span>
              )}
            </div>
            {cat.description && (
              <p className="text-[11px] text-[#9E988D] font-normal truncate max-w-[180px] mt-0.5">
                {cat.description}
              </p>
            )}
          </td>

          {/* Products */}
          <td className="px-4 py-3 text-center">
            <span className="font-mono text-xs text-[#8C6D2B] font-bold">
              {cat.products_count ?? "—"}
            </span>
          </td>

          {/* Status */}
          <td className="px-4 py-3">
            {Number(cat.status) === 1 ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700">
                Inactive
              </span>
            )}
          </td>

          {/* Actions */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              {/* Edit */}
              <button
                onClick={() => {
                  setEditCategory(cat);
                  setEditImageFile(null);
                  setEditImagePreview(cat.image ? getImageUrl(cat.image) : null);
                }}
                className="p-1.5 rounded-lg border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all"
                title="Edit"
              >
                ✏️
              </button>

              {/* Quick-add sub/child */}
              {level === 1 && (
                <Link
                  href={`/admin/categories/create?parent_id=${cat.id}`}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#E8E2D5] text-[10px] font-bold text-[#8C6D2B] hover:bg-[#FAF8F5] hover:border-[#C5A059] transition-all"
                  title="Add Sub-Category"
                >
                  <Plus className="w-3 h-3" /> Sub
                </Link>
              )}
              {level === 2 && (
                <Link
                  href={`/admin/categories/create?parent_id=${cat.id}`}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#E8E2D5] text-[10px] font-bold text-[#6E685E] hover:bg-[#FAF8F5] hover:border-[#6E685E] transition-all"
                  title="Add Child Category"
                >
                  <Plus className="w-3 h-3" /> Child
                </Link>
              )}

              {/* Delete */}
              <button
                onClick={() => handleDelete(cat)}
                className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all"
                title="Delete"
              >
                🗑
              </button>
            </div>
          </td>
        </tr>

        {/* Children rows (when expanded or searching) */}
        {level === 1 && (isExpanded || q) &&
          (cat.children || []).map((sub) => (
            <React.Fragment key={sub.id}>
              {renderRow(sub, 2, cat.id)}
            </React.Fragment>
          ))}

        {level === 2 && (isExpanded || q) &&
          (cat.children || []).map((child) => (
            <React.Fragment key={child.id}>
              {renderRow(child, 3, cat.id)}
            </React.Fragment>
          ))}
      </React.Fragment>
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Catalog Management
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">
              Product Categories
            </h1>
            <p className="text-xs text-[#9E988D] mt-1">
              {totalL1} Categor{totalL1 !== 1 ? "ies" : "y"} ·{" "}
              {totalL2} Sub-Categor{totalL2 !== 1 ? "ies" : "y"} ·{" "}
              {totalL3} Child Categor{totalL3 !== 1 ? "ies" : "y"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
            />

            <button
              type="button"
              onClick={() => {
                const allIds = new Set<number>();
                tree.forEach((l1) => {
                  allIds.add(l1.id);
                  (l1.children || []).forEach((l2) => allIds.add(l2.id));
                });
                setExpanded(allIds);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#8C6D2B] border border-[#E8E2D5] text-xs font-bold rounded-xl transition-all shadow-sm"
              title="Expand All Categories"
            >
              <ChevronDown className="w-3.5 h-3.5" /> Expand All
            </button>

            <button
              type="button"
              onClick={() => setExpanded(new Set())}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#6E685E] border border-[#E8E2D5] text-xs font-bold rounded-xl transition-all shadow-sm"
              title="Collapse All Categories"
            >
              <ChevronRight className="w-3.5 h-3.5" /> Collapse All
            </button>

            <Link
              href="/admin/categories/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Add Category</span>
            </Link>
          </div>
        </div>

        {/* Top Control Bar with Per Page selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-5 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm text-xs text-[#1C1A17]">
          <div className="flex items-center gap-3">
            <span className="text-[#6E685E] font-medium">Per Page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] font-mono font-bold text-xs rounded-xl focus:outline-none focus:border-[#C5A059] transition-all shadow-inner"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-[#9E988D] text-[11px]">categories per page</span>
          </div>
          <div className="text-[#8C6D2B] font-mono text-[11px] font-bold">
            Total {tree.length} Root Categories
          </div>
        </div>

        {/* Tree Table */}
        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
              Loading Category Tree...
            </p>
          </div>
        ) : tree.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-4 py-4 w-36">Level</th>
                    <th className="px-4 py-4 w-16">Image</th>
                    <th className="px-4 py-4">Name / Description</th>
                    <th className="px-4 py-4 text-center w-24">Products</th>
                    <th className="px-4 py-4 w-24">Status</th>
                    <th className="px-4 py-4 w-48">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tree
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((cat) => (
                      <React.Fragment key={cat.id}>
                        {renderRow(cat, 1)}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={tree.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No categories found.</p>
          </div>
        )}

        {/* Edit Modal */}
        {editCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">
                    Edit Category
                  </span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">
                    Category #{editCategory.id}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditCategory(null);
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
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editCategory.name}
                    onChange={(e) =>
                      setEditCategory({ ...editCategory, name: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]"
                  />
                </div>

                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editCategory.description || ""}
                    onChange={(e) =>
                      setEditCategory({
                        ...editCategory,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]"
                  />
                </div>

                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Thumbnail Image
                  </label>
                  {editImagePreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-[#E8E2D5]"
                      />
                      <label className="px-3 py-1.5 bg-white border border-[#E8E2D5] hover:bg-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider text-[#1C1A17] rounded-lg cursor-pointer transition-all">
                        Change Image
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setEditImageFile(file);
                              setEditImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center p-4 border border-dashed border-[#E8E2D5] hover:border-[#C5A059] rounded-xl bg-white cursor-pointer transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                        + Upload Thumbnail
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditImageFile(file);
                            setEditImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Publication Status
                  </label>
                  <select
                    value={Number(editCategory.status)}
                    onChange={(e) =>
                      setEditCategory({
                        ...editCategory,
                        status: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => setEditCategory(null)}
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

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading categories...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}
