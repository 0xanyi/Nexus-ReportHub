import { Suspense } from "react";
import { ProductList } from "@/components/products/ProductList";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage products available for orders. Add new products, edit existing ones, and manage pricing.
        </p>
      </div>

      <Suspense fallback={<div>Loading products...</div>}>
        <ProductList />
      </Suspense>
    </div>
  );
}