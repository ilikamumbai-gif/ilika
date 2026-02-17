import { useCategories } from "../context/CategoryContext";

const Hair = () => {
  const { categories } = useCategories();

  const hairCategory = categories.find(
    (c) => c.name.toLowerCase() === "hair"
  );

  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer/>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading heading="Hair Products" />

          {hairCategory && (
            <ProductList categoryId={hairCategory.id} />
          )}

        </section>

        <Footer/>
      </div>
    </>
  )
}
