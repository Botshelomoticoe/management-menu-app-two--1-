## Fixing part 2 errors

**Fixed font loading error**
   
   - Removed the unnecessary "useFonts" functionality.
   - Used system fonts to allow the application to run correctly.

**Fixed background image error**
   
   - Corrected the background image reference.
   - Updated the image loading using "require()".

**Fixed Toast notification warning**
   
   - Updated the "useEffect" dependency array to include "onHide" and "opacity".

**Improved text visibility**
   
   - Reduced background image opacity.
   - Darkened the heading and body text colours.
   - Improved heading font weight for better readability.

## POE Changes

**Menu Management**

- Added a Remove button next to the existing Edit button for menu items.
- Implemented a confirmation message before removing a menu item.
- Updated the menu management functionality to remove selected items from the menu.
- Improved feedback messages after menu items are added, edited or removed.

**Search and Filter Functionality**

- Added a search bar to the home screen to allow users to search for menu items by name.
- Added course filtering to display menu items according to their category.
- Updated the displayed search results whenever the search text or selected filter changes.

**Menu Statistics**

- Created a separate Statistics screen.
- Added a Statistics button to the home screen for easier navigation.
- Implemented automatic calculation of the total number of menu items.
- Implemented calculation of the average price of all menu items.
- Added statistics showing the number of items available in each course.
- Connected the statistics to the application's menu data so that it can recalculate after items are added, edited or removed.
# Sample Snack app

