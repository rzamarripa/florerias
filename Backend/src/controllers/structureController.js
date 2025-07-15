import mongoose from "mongoose";

export const getStructureTree = async (req, res) => {
  try {
    const { userId } = req.query;

    const Category = mongoose.model("cc_category");
    const Company = mongoose.model("cc_companies");
    const Brand = mongoose.model("cc_brand");
    const Branch = mongoose.model("cc_branch");
    const Route = mongoose.model("cc_route");
    const RsCompanyBrand = mongoose.model("rs_company_brand");
    const RsBranchBrand = mongoose.model("rs_branch_brand");
    const RoleVisibility = mongoose.model("ac_user_visibility");

    let visibility = null;
    if (userId) {
      visibility = await RoleVisibility.findOne({ userId });
    }

    const categories = await Category.find({ isActive: true });
    const tree = [];

    for (const category of categories) {
      const categoryNode = {
        id: `category_${category._id}`,
        text: category.name,
        type: "category",
        hasRoutes: category.hasRoutes,
        children: [],
        canAdd: false,
        entityData: {
          _id: category._id,
          name: category.name,
          hasRoutes: category.hasRoutes
        }
      };

      const companyBrandRelations = await RsCompanyBrand.find()
        .populate("companyId")
        .populate({
          path: "brandId",
          populate: {
            path: "categoryId",
            model: "cc_category",
          },
        });

      const relevantRelations = companyBrandRelations.filter(
        (rel) =>
          rel.brandId?.categoryId?._id.toString() === category._id.toString()
      );

      const companyMap = new Map();

      for (const relation of relevantRelations) {
        const company = relation.companyId;
        const brand = relation.brandId;

        if (!company || !brand) continue;

        if (visibility) {
          if (!visibility.hasAccessToCompany(company._id)) continue;
          if (!visibility.hasAccessToBrand(company._id, brand._id)) continue;
        }

        if (!companyMap.has(company._id.toString())) {
          companyMap.set(company._id.toString(), {
            id: `company_${company._id}`,
            text: company.name,
            type: "company",
            children: [],
            canAdd: true,
            addType: "brand",
            entityData: {
              _id: company._id,
              name: company.name,
              categoryId: category._id
            }
          });
        }

        const companyNode = companyMap.get(company._id.toString());

        // Tanto con rutas como sin rutas: Company -> Brand -> Branch
        let brandNode = companyNode.children.find(
          (child) => child.id === `brand_${brand._id}`
        );

        if (!brandNode) {
          brandNode = {
            id: `brand_${brand._id}`,
            text: brand.name,
            type: "brand",
            children: [],
            canAdd: true,
            addType: "branch",
            entityData: {
              _id: brand._id,
              name: brand.name,
              categoryId: category._id,
              companyId: company._id
            }
          };
          companyNode.children.push(brandNode);
        }

        const branchBrandRelations = await RsBranchBrand.find({
          brandId: brand._id,
        }).populate("branchId");

        const relevantBranches = branchBrandRelations.filter(
          (rel) =>
            rel.branchId?.companyId?.toString() === company._id.toString()
        );

        for (const branchRelation of relevantBranches) {
          const branch = branchRelation.branchId;

          if (!branch || !branch.isActive) continue;

          if (
            visibility &&
            !visibility.hasAccessToBranch(company._id, brand._id, branch._id)
          ) {
            continue;
          }

          const branchNode = {
            id: `branch_${branch._id}`,
            text: branch.name,
            type: "branch",
            children: [],
            canAdd: category.hasRoutes,
            addType: category.hasRoutes ? "route" : undefined,
            entityData: {
              _id: branch._id,
              name: branch.name,
              categoryId: category._id,
              companyId: company._id,
              brandId: brand._id
            }
          };

          if (category.hasRoutes) {
            const routes = await Route.find({
              categoryId: category._id,
              companyId: company._id,
              brandId: brand._id,
              branchId: branch._id,
              status: true,
            });

            for (const route of routes) {
              const routeNode = {
                id: `route_${route._id}`,
                text: route.name,
                type: "route",
                canAdd: false,
                entityData: {
                  _id: route._id,
                  name: route.name,
                  description: route.description,
                  categoryId: category._id,
                  companyId: company._id,
                  brandId: brand._id,
                  branchId: branch._id
                }
              };
              branchNode.children.push(routeNode);
            }
          }

          brandNode.children.push(branchNode);
        }
      }

      categoryNode.children = Array.from(companyMap.values());

      if (categoryNode.children.length > 0) {
        tree.push(categoryNode);
      }
    }

    res.json({
      success: true,
      data: tree,
      message: "Structure tree retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting structure tree:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving structure tree",
      error: error.message,
    });
  }
}; 