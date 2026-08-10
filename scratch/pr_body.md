## Summary
This Pull Request resolves several critical issues encountered during the implementation of the project assignment and dashboard systems.

### Key Changes:
1. **Thumbnail System Fixes**: 
   - Updated `thumbnail_url` in the database schema to `longtext` to accommodate large Base64 image strings.
   - Implemented a more robust thumbnail upload field in the project assignment form.
   - Optimized project list queries to exclude the heavy `thumbnailUrl` field, significantly reducing payload size and improving dashboard loading speed.

2. **Dashboard Rendering Stability**:
   - Resolved a critical bug where the dashboard would appear blank due to Alpine.js crashing. The root cause was unescaped newline characters in generated JavaScript strings and invalid JSON injection methods.
   - Switched to a secure and robust JSON injection method using `<script type="application/json">` to ensure data integrity.

3. **Feature Enhancements**:
   - Finalized **Word Search** game interactivity for both game makers and players.
   - Updated **Pakar Dashboard** to only show projects that are ready for review, filtering out those still in the 'DRAFT' phase.
   - Implemented multiple category selection (tags/chips) for project assignments.

4. **Security & Data Integrity**:
   - Updated project deletion routes to properly handle foreign key dependencies (notifications, reviews, game-specific data).
   - Ensured proper type coercion for User IDs in dashboard queries.

These fixes ensure a seamless and premium experience for all roles in the Logos LAB ecosystem.
