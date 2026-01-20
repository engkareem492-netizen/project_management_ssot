# Project Management SSOT - Published Version

## Quick Start

This is a fully functional Project Management Single Source of Truth (SSOT) application with comprehensive project tracking, requirement management, and team collaboration features.

### Features

- **Today Dashboard** - Quick view of tasks and requirements due today with status updates
- **Requirements Management** - Track and manage project requirements with auto-generated IDs
- **Task Management** - Create and track tasks linked to requirements
- **Issue Tracking** - Monitor and resolve project issues
- **Stakeholder Management** - Manage team members and their roles
- **Deliverables Tracking** - Track project deliverables and milestones
- **Action Logging** - Complete audit trail of all changes
- **Relationship Mapping** - Visualize dependencies and relationships
- **Excel Import/Export** - Import requirements and export data to Excel
- **Settings Management** - Customize dropdown options for Status, Priority, Type, and Category

### Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Environment Variables**
   Create a `.env` file with:
   ```
   DATABASE_URL=your_database_url
   OAUTH_SERVER_URL=your_oauth_server
   JWT_SECRET=your_jwt_secret
   VITE_APP_ID=your_app_id
   ```

3. **Build the Project**
   ```bash
   pnpm build
   ```

4. **Start the Server**
   ```bash
   pnpm start
   ```

5. **Access the Application**
   Open your browser and navigate to `http://localhost:3000`

### Key Pages

- **/today** - Today's dashboard with due items and quick actions
- **/requirements** - Manage project requirements
- **/tasks** - Track project tasks
- **/issues** - Monitor project issues
- **/dependencies** - Manage project dependencies
- **/assumptions** - Track project assumptions
- **/stakeholders** - Manage team members
- **/deliverables** - Track deliverables
- **/action-log** - View audit trail
- **/relationships** - Visualize relationships
- **/settings** - Configure application settings

### Technology Stack

- **Frontend:** React 19 + TypeScript + TailwindCSS
- **Backend:** Node.js + Express + tRPC
- **Database:** MySQL/TiDB with Drizzle ORM
- **Build Tool:** Vite
- **UI Components:** shadcn/ui

### Documentation

- **ENHANCEMENTS_V4_SUMMARY.md** - Detailed feature documentation
- **TESTING_CHECKLIST.md** - Complete testing procedures
- **DEPLOYMENT_GUIDE.md** - Deployment and maintenance guide
- **USER_GUIDE.md** - User guide and best practices

### Support

For issues or questions, refer to the comprehensive documentation provided in the project root directory.

### Version

**Version:** 4.0.0  
**Release Date:** January 2026  
**Status:** Production Ready

---

**Ready to use!** Start with `pnpm install && pnpm build && pnpm start`
