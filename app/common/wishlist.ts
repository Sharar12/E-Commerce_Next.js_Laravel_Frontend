import { apiUrl } from "./http";

/**
 * Toggle a product in the authenticated user's wishlist.
 * If already in wishlist -> removes it and returns { added: false, success: true }
 * If not in wishlist -> adds it and returns { added: true, success: true }
 */
export async function toggleWishlist(productId: number | string): Promise<{ added: boolean; success: boolean }> {
  try {
    const token = localStorage.getItem("adminToken");
    const userStr = localStorage.getItem("adminUser");
    if (!token || !userStr) {
      alert("Please log in to save items to your wishlist.");
      return { added: false, success: false };
    }
    const user = JSON.parse(userStr);

    // Fetch existing wishlist items to check if item is already present
    const checkRes = await fetch(`${apiUrl}/wishlists`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const checkData = await checkRes.json();
    const existingList = Array.isArray(checkData.data) ? checkData.data : [];
    const match = existingList.find((w: any) => w.user_id === user.id && String(w.product_id) === String(productId));

    if (match) {
      // Delete existing item from wishlist
      const delRes = await fetch(`${apiUrl}/wishlists/${match.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      return { added: false, success: delRes.ok };
    } else {
      // Add new item to wishlist
      const addRes = await fetch(`${apiUrl}/wishlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ user_id: user.id, product_id: Number(productId) || productId }),
      });
      return { added: true, success: addRes.ok || addRes.status === 201 };
    }
  } catch (e) {
    console.error("Toggle wishlist error:", e);
    return { added: false, success: false };
  }
}

/**
 * Add a product to the authenticated user's wishlist.
 */
export async function addToWishlist(productId: number | string): Promise<boolean> {
  const result = await toggleWishlist(productId);
  return result.success;
}

/**
 * Remove a wishlist record by its wishlist item ID.
 */
export async function removeFromWishlist(wishlistId: number): Promise<boolean> {
  try {
    const token = localStorage.getItem("adminToken");
    if (!token) return false;
    const res = await fetch(`${apiUrl}/wishlists/${wishlistId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    return res.ok;
  } catch (e) {
    console.error("Wishlist remove error:", e);
    return false;
  }
}
