class Dish {
    constructor(dish_id, master_menu_id, name, category, price, description, image_url, is_active) {
        this.dish_id = dish_id;
        this.master_menu_id = master_menu_id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.description = description;
        this.image_url = image_url;
        this.is_active = is_active;
    }
}

module.exports = Dish;