# Property Owners

ADMIN opens **Properties → Property Owners** to search, create, inspect or edit owners. Owner details list active linked properties with pagination and navigation into property details.

Inside **Create/Edit property**, use **Add owner** below the owner picker. Enter the required name, email and phone, then save. The new owner is selected automatically. Cancel and validation errors preserve the property fields and attachments. Finish saving the property to persist its owner assignment.

Full property details show the assigned owner's contact information for ADMIN. When no owner is assigned, use **Manage property owners**, then select an owner when editing the property.

The backend continues using `Lessor` and `/lessors`. `GET /lessors` accepts optional `search` (name) and `page`; responses retain Laravel pagination metadata. `GET /lessors/{id}/properties?page=1` is ADMIN-only and returns `data.records` and `data.next_page`. Owner create/update is ADMIN-only; existing scoped MANAGER reads and selection remain available. No owner deletion or legacy owner-verification UI is provided.

Deploy the backend controller, route and permission changes before using the mobile screens. This owner feature adds no schema migration. The separate #103 verification migrations remain prerequisites for the current combined checkout.

Validation: owner API tests cover pagination, case-insensitive literal search, audit privacy, manager restrictions and cross-account assignment. Mobile tests cover mutation/route guards and preservation of owner/images in unpublished property payloads. Actual native navigation, quick-add and return flows require signing in to a migrated backend.
