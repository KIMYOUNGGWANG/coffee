-- Alter coffee_shelf_items table to add rating and want_again columns
ALTER TABLE coffee_shelf_items 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS want_again BOOLEAN DEFAULT false;
