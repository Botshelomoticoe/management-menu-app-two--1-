import React, {useState, useEffect, useRef, useCallback} from 'react';
import {StyleSheet, Text, TextInput, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, Animated, SafeAreaView, StatusBar, ImageBackground,} from 'react-native';

// Fonts
const Fonts = {
  heading: Platform.select({ ios:'Georgia', android: 'serif', default:'Georgia'}),
  body: Platform.select({ ios:undefined, android:'sans-serif', default:undefined}),
};

// Courses
const COURSES = [
  { key: 'starters', label: 'Starters', title: 'Starters' },
  { key: 'mains', label: 'Mains', title: 'Mains' },
  { key: 'desserts', label: 'Dessert', title: 'Desserts' },
  { key: 'drinks', label: 'Drinks', title: 'Drinks' },
];

// Filter buttons on the Home screen where "All" opens the All Items page
const FILTERS = [{ key: 'all', label: 'All' }, ...COURSES];

// Menu items
let idCounter = 100; // id generator for new dishes
const newId = () => String(++idCounter);

const INITIAL_MENU = {
  starters: [
    {id:'1',name:'Fried Calamari', price:'95', description: 'Buttered and deep fried, served with fresh lemon and garlic butter'},
    {id:'2', name: 'Chicken Livers', price: '85', description: 'Peri-peri sauce and heavy cream, garnished with sea salt an parsley'},
    {id:'3', name: 'Wings', price: '110', description: 'Flame grilled and then tossed in BBQ or peri-peri sauce'},
    {id:'4', name: 'Parmigiano Loaded Fries', price: '65', description: 'Covered in cheese, jalape\u00F1os, house-made sauce, topped with bacon'},
  ],
  mains: [
    {id:'5', name: 'Chicken Alfredo', price:'145', description: 'Grilled chicken, mushrooms, creamy cheese sauce, garlic fettuccine'},
    {id:'6',name: 'Margherita', price: '120', description: 'Napoletana sauce, fresh mozzarella'},
    {id:'7', name: 'Calzone', price: '135', description: 'BBQ chicken, bacon, feta cheese'},
    {id:'8', name: 'Steak Sandwich', price: '165', description: 'Grilled steak, lettuce, tomato, toasted roll, served with chips'},
    {id:'9', name: 'Chicken Burger', price: '125', description: 'Fried chicken, cheddar, bacon, onion rings, served with chips'},
  ],
  desserts: [
    {id:'10', name: 'Tiramisu', price: '75', description: 'Espresso biscuits, vanilla cream'},
    {id:'11', name: 'Chocolate Brownie', price: '65', description: 'Rich chocolate brownie with ice cream'},
  ],
  drinks: [
    {id: '12', name: 'Still & Sparkling Water', price: '25', description: 'Plain still water and lightly carbonated sparkling water, served chilled'},
    {id: '13', name: 'Soft Drinks', price: '30', description: '(Cola & Lemonade) Classic cola and a clear lemonade or lemon-lime soda'},
    {id: '14', name: 'Fresh Orange Juice', price: '35', description: 'Freshly squeezed orange juice'},
    {id: '15', name: 'House Red & White Wine', price: '60', description: 'A glass of our house red or white wine'},
    {id: '16', name: 'Filter Coffee / Espresso', price: '28', description: 'Freshly brewed filter coffee, or a proper espresso (or americano)'},
  ],
};

// COLORS from the figma wireframes
const COLORS = {
  background: '#F4DFE4',
  card: '#FBF1F3',
  title: '#641522',
  button: '#C99AAA',
  buttonPressed: '#B7859A',
  buttonText: '#3B1F27',
  text: '#1F1B1C',
  mutedText: '#8C7F83',
  input: '#FAF7F8',
  inputBorder: '#E6CDD4',
  error: '#B3261E',
  success: '#2E7D32',
  sketch: '#B5473A',
};

// Validation

// Turns what the user typed in "Add course" into a course key, or null
function normaliseCourse(text) {
  const t = text.trim().toLowerCase();
  if (['starter', 'starters'].includes(t)) return 'starters';
  if (['main', 'mains'].includes(t)) return 'mains';
  if (['dessert', 'desserts'].includes(t)) return 'desserts';
  if (['drink', 'drinks'].includes(t)) return 'drinks';
  return null;
}

// Removes an optional "R" prefix in front of the price
function cleanPrice(text) {
  return String(text).trim().replace(/^r\s*/i, '');
}

// Checks a dish form and returns an object of error messages
function validateDish(values, menu, { editingId, requireCourse, courseKey }) {
  const errors = {};

  // Course (Add screen only)
  let targetCourse = courseKey;
  if (requireCourse) {
    if (!values.course.trim()) {
      errors.course = 'Course is required';
    } else {
      targetCourse = normaliseCourse(values.course);
      if (!targetCourse) {
        errors.course = 'Course must be Starters, Mains, Desserts or Drinks';
      }
    }
  }

  // Name
  const name = values.name.trim();
  if (!name) {
    errors.name = 'Name of dish is required';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (name.length > 45) {
    errors.name = 'Name must be 45 characters or less';
  } else if (targetCourse) {
    // Don't allow two dishes with the same name in one course
    const duplicate = menu[targetCourse].some(
      (d) => d.name.toLowerCase() === name.toLowerCase() && d.id !== editingId
    );
    if (duplicate) errors.name = 'A dish with this name already exists in this course';
  }

  // Description
  const description = values.description.trim();
  if (!description) {
    errors.description = 'Description is required';
  } else if (description.length < 5) {
    errors.description = 'Description must be at least 5 characters';
  } else if (description.length > 160) {
    errors.description = 'Description must be 160 characters or less';
  }

  // Price
  const price = cleanPrice(values.price);
  if (!price) {
    errors.price = 'Price is required';
  } else if (!/^\d+(\.\d{1,2})?$/.test(price)) {
    errors.price = 'Price must be a number, e.g. 70.80 or 100';
  } else if (parseFloat(price) <= 0) {
    errors.price = 'Price must be more than R0';
  } else if (parseFloat(price) > 10000) {
    errors.price = 'Price looks too high - please check it';
  }

  return errors;
}

// Reusable components 

function ScreenBackground({ children, faded }) {
  return (
    <ImageBackground
      source={require('./assets/menu.bg.png')}
      style={styles.background}
      imageStyle={[styles.backgroundImage, { opacity: faded ? 0.3 : 0.9 }]}
      resizeMode="contain"
    >
      {children}
    </ImageBackground>
  );
}

// The button used everywhere
function PillButton({ label, onPress, style, textStyle, small }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.pill, small && styles.pillSmall, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.pillText, small && styles.pillTextSmall, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Small "Back" link shown at the top of the inner screens
function BackLink({ onPress, label = 'Back' }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backLink} accessibilityRole="button">
      <Text style={styles.backLinkText}>{'\u2190'} {label}</Text>
    </TouchableOpacity>
  );
}

function FormField({placeholder, value, onChangeText, error, multiline, keyboardType, hint }) {
  return (
    <View style={styles.fieldWrap}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={COLORS.mutedText}
        value={value}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

// Pop up confirmation box
function ConfirmModal({ visible, title, message, confirmLabel = 'Yes', onConfirm, onCancel }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
    <Text style={styles.modalTitle}>{title}</Text>
    <Text style={styles.modalMessage}>{message}</Text>
    <View style={styles.modalButtons}>
    <PillButton label="Cancel" onPress={onCancel} small style={styles.modalCancel} />
    <PillButton label={confirmLabel} onPress={onConfirm} small />
    </View>
  </View>
  </View>
</Modal>
  );
}

// Green banner that fades in at the top to give a successful feedback
function Toast({ message, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.sequence([
    Animated.timing(opacity, {toValue:1, duration: 250, useNativeDriver: true}),
    Animated.delay(2200),
    Animated.timing(opacity, {toValue:0, duration: 300, useNativeDriver: true}),
    ]).start(() => onHide());
  }, [message, onHide, opacity]);

  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// Edit and Remove buttons next to each other for all course screeens
function DishRow({dish, badgeLabel,subtitle,onEdit, onRemove }) {
  return (
    <View style={[styles.dishRow, isNew && styles.dishRowHighlight]}>
      <View style={styles.dishInfo}>
        <Text style={styles.dishName}>
          {dish.name}
          {isNew ? <Text style={styles.badge}>{`  ${badgeLabel}`}</Text> : null}
        </Text>
        <Text style={styles.dishPrice}>
          R{dish.price}
          {subtitle ? ` \u00B7 ${subtitle}` : ''}
        </Text>
        <Text style={styles.dishDescription}>{dish.description}</Text>
      </View>
      <View style={styles.actionButtons}>
        <PillButton label="Edit" small onPress={onEdit} />
        <PillButton label="Remove" small onPress={onRemove} style={styles.removeButton} textStyle={styles.removeButtonText} />
      </View>
    </View>
  );
}

// HOME: search bar and filter course buttons 
// Menu items are hidden here. Filter buttons open the matching page.
// Search results only appear while the user is typing.
function HomeScreen({ menu, onOpenCourse, onOpenAll, onOpenStats, onEdit, onRemove }) {
  const [searchText, setSearchText] = useState('');
  const query = searchText.trim().toLowerCase();

  const allDishes = COURSES.flatMap((course) =>
    menu[course.key].map((dish) => ({
      ...dish,
      courseKey: course.key,
      courseTitle: course.title,
    }))
  );

  const results = qury
    ? allDishes.filter((dish) => dish.name.toLowerCase().includes(query))
    : [];

  return (
    <ScreenBackground>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.homeTitle}>Cafe Menu Management</Text>

        /* Search menu items */
        <Text style={styles.homeSectionTitle}>Search Menu Items</Text>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search by menu item name..."
          placeholderTextColor={COLORS.mutedText}
          accessibilityLabel="Search menu items by name"
          style={styles.searchInput}
        />

        {/* Filter by course - each button opens its own page */}
        <Text style={styles.filterLabel}>Filter by course</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <PillButton
              key={f.key}
              label={f.label}
              small
              style={styles.filterButton}
              onPress={() => (f.key === 'all' ? onOpenAll() : onOpenCourse(f.key))}
            />
          ))}
        </View>

        /* Search results after searching */
        {query ? (
          <View style={styles.resultsWrap}>
            <Text style={styles.resultsHeading}>Search Results ({results.length})</Text>
            {results.length === 0 ? (
              <Text style={styles.emptyText}>No menu items match "{searchText.trim()}".</Text>
            ) : (
              results.map((dish) => (
                <DishRow key={dish.id} dish={dish} subtitle={dish.courseTitle} onEdit={() => onEdit(dish.courseKey, dish)}
                  onRemove={() => onRemove(dish.courseKey, dish)}
                />
              ))
            )}
            <PillButton label="Clear Search" small onPress={() => setSearchText('')} style={styles.clearButton} />
          </View>
        ) : null}

        <PillButton label="View Statistics" onPress={onOpenStats} style={styles.statsButton} />

      </ScrollView>
    </ScreenBackground>
  );
}

// Course page
function CourseScreen({ courseKey, menu, highlight, onBack, onEdit, onAdd, onRemove }) {
  const course = COURSES.find((c) => c.key === courseKey);
  const dishes = menu[courseKey];

  return (
    <ScreenBackground faded>
      <BackLink onPress={onBack} label="Home" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator contentContainerStyle={styles.listContent}>
        <Text style={styles.screenTitle}>{course.title}</Text>

        {dishes.length === 0 && (
          <Text style={styles.emptyText}>No dishes yet. Select "Add" to create one.</Text>
        )}

        {dishes.map((dish) => (
          <DishRow
            key={dish.id}
            dish={dish}
            isNew={!!highlight && dish.id === highlight.id}
            badgeLabel={highlight ? highlight.label : ''}
            onEdit={() => onEdit(courseKey, dish)}
            onRemove={() => onRemove(courseKey, dish)}
          />
        ))}

        /* Add button - centred at the end of every course page */
        <PillButton label="Add" onPress={onAdd} style={styles.bottomButton} />
      </ScrollView>
    </ScreenBackground>
  );
}

// All item page
function AllItemsScreen({ menu, highlight, onBack, onEdit, onAdd, onRemove }) {
  return (
    <ScreenBackground faded>
      <BackLink onPress={onBack} label="Home" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator contentContainerStyle={styles.listContent}>
        <Text style={styles.screenTitle}>All Menu Items</Text>

        {COURSES.map((course) => (
        <View key={course.key} style={styles.courseSection}>
          <Text style={styles.courseSectionTitle}>{course.title}</Text>
            {menu[course.key].length === 0 ? (
              <Text style={styles.emptyText}>No dishes in this course yet.</Text>
            ) : (
        menu[course.key].map((dish) => (
        <DishRow
           key={dish.id}
           dish={dish}
           isNew={!!highlight && dish.id === highlight.id}
          badgeLabel={highlight ? highlight.label : ''}
          onEdit={() => onEdit(course.key, dish)}
          onRemove={() => onRemove(course.key, dish)}
          />
       ))
       )}
      </View>
        ))}

        <PillButton label="Add" onPress={onAdd} style={styles.bottomButton} />
      </ScrollView>
    </ScreenBackground>
  );
}

// Stats
function StatisticsScreen({ menu, onBack }) {
  const allDishes = COURSES.flatMap((course) => menu[course.key]);
  const totalItems = allDishes.length;
  const totalPrice = allDishes.reduce((sum, dish) => sum + (parseFloat(dish.price) || 0), 0);
  const averagePrice = totalItems > 0 ? totalPrice / totalItems : 0;

  return (
    <ScreenBackground faded>
      <BackLink onPress={onBack} label="Home" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator contentContainerStyle={styles.statsContent}>
        <Text style={styles.screenTitle}>Menu Statistics</Text>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total menu items</Text>
          <Text style={styles.statValue}>{totalItems}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Average menu price</Text>
          <Text style={styles.statValue}>R{averagePrice.toFixed(2)}</Text>
        </View>

        <Text style={styles.statsSubheading}>Menu items per course</Text>
        {COURSES.map((course) => (
          <View key={course.key} style={styles.courseStatRow}>
            <Text style={styles.courseStatName}>{course.title}</Text>
            <Text style={styles.courseStatCount}>{menu[course.key].length} items</Text>
          </View>
        ))}

      </ScrollView>
    </ScreenBackground>
  );
}

// Add
function AddScreen({ defaultCourse, menu, onSave, onBack }) {
  // has information of the course from the page the user came from 
  const startCourse = COURSES.find((c) => c.key === defaultCourse)?.title || '';
  const [values, setValues] = useState({ course: startCourse, name: '', description: '', price: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const setField = (field) => (text) => {
    const next = { ...values, [field]: text };
    setValues(next);
    if (submitted) setErrors(validateDish(next, menu, { requireCourse: true }));
  };

  const handleAdd = () => {
    setSubmitted(true);
    const found = validateDish(values, menu, { requireCourse: true });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSave(normaliseCourse(values.course), {
      id: newId(),
      name: values.name.trim(),
      description: values.description.trim(),
      price: cleanPrice(values.price),
    });
  };

  const hasChanges = values.name || values.description || values.price;
  const handleBack = () => (hasChanges ? setConfirmLeave(true) : onBack());

  return (
    <ScreenBackground faded>
      <BackLink onPress={handleBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.screenTitle}>Add</Text>

          {Object.keys(errors).length > 0 && (
            <Text style={styles.formErrorSummary}>Please fix the highlighted fields below.</Text>
          )}

          <FormField
            placeholder="Add course"
            value={values.course}
            onChangeText={setField('course')}
            error={errors.course}
            hint="Starters, Mains, Desserts or Drinks"
          />
          <FormField placeholder="Add name of Dish" value={values.name} onChangeText={setField('name')} error={errors.name} />
          <FormField
            placeholder="Add New dish description"
            value={values.description}
            onChangeText={setField('description')}
            error={errors.description}
            multiline
          />
          <FormField
            placeholder="Add new price"
            value={values.price}
            onChangeText={setField('price')}
            error={errors.price}
            keyboardType="decimal-pad"
            hint="In Rands, e.g. 95 or 95.50"
          />

          <PillButton label="ADD" onPress={handleAdd} style={styles.bottomButton} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirmLeave}
        title="Discard dish?"
        message="You have unsaved information. Are you sure you want to go back?"
        confirmLabel="Discard"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          onBack();
        }}
      />
    </ScreenBackground>
  );
}

// Edit
function EditScreen({ courseKey, dish, menu, onSave, onBack }) {
  const [values, setValues] = useState({
    name: dish.name,
    description: dish.description,
    price: dish.price,
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const opts = { requireCourse: false, editingId: dish.id, courseKey };

  const setField = (field) => (text) => {
    const next = { ...values, [field]: text };
    setValues(next);
    if (submitted) setErrors(validateDish(next, menu, opts));
  };

  const hasChanges =
    values.name.trim() !== dish.name ||
    values.description.trim() !== dish.description ||
    cleanPrice(values.price) !== dish.price;

  const handleEdit = () => {
    setSubmitted(true);
    const found = validateDish(values, menu, opts);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!hasChanges) {
      setErrors({ form: 'Nothing has changed yet , edit a field first.' });
      return;
    }
    setConfirmSave(true);
  };

  const doSave = () => {
    setConfirmSave(false);
    onSave(courseKey, {
      ...dish,
      name: values.name.trim(),
      description: values.description.trim(),
      price: cleanPrice(values.price),
    });
  };

  const handleBack = () => (hasChanges ? setConfirmLeave(true) : onBack());

  return (
    <ScreenBackground faded>
      <BackLink onPress={handleBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.screenTitle}>EDIT</Text>

          {errors.form ? <Text style={styles.formErrorSummary}>{errors.form}</Text> : null}
          {!errors.form && Object.keys(errors).length > 0 && (
            <Text style={styles.formErrorSummary}>Please fix the highlighted fields below.</Text>
          )}

          <FormField placeholder="Edit name" value={values.name} onChangeText={setField('name')} error={errors.name} />
          <FormField
            placeholder="Edit description"
            value={values.description}
            onChangeText={setField('description')}
            error={errors.description}
            multiline
          />
          <FormField
            placeholder="Edit price"
            value={values.price}
            onChangeText={setField('price')}
            error={errors.price}
            keyboardType="decimal-pad"
            hint="In Rand, e.g. 95 or 95.50"
          />

          <PillButton label="EDIT" onPress={handleEdit} style={styles.bottomButton} />
        </ScrollView>
      </KeyboardAvoidingView>

      /* Confirm before saving the changes */
      <ConfirmModal
        visible={confirmSave}
        title="Save changes?"
        message={`Update "${values.name.trim()}" to R${cleanPrice(values.price)}?`}
        confirmLabel="Save"
        onCancel={() => setConfirmSave(false)}
        onConfirm={doSave}
      />

      /* Confirm before leaving with unsaved changes */
      <ConfirmModal
        visible={confirmLeave}
        title="Discard changes?"
        message="Your edits have not been saved. Go back anyway?"
        confirmLabel="Discard"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          onBack();
        }}
      />
    </ScreenBackground>
  );
}

// APP: holds the menu data and decides which screen to show 
export default function App() {
  const [menu, setMenu] = useState(INITIAL_MENU);
  const [screen, setScreen] = useState('home'); // home,course, all,add,edit,stats
  const [courseKey, setCourseKey] = useState('starters');
  const [listScreen, setListScreen] = useState('course'); // page to return to after Add/Edit
  const [editingDish, setEditingDish] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [toast, setToast] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const hideToast = useCallback(() => setToast(''), []);

  // navigation helpers
  const openCourse = (key) => {
    setCourseKey(key);
    setHighlight(null);
    setListScreen('course');
    setScreen('course');
  };

  const openAll = () => {
    setHighlight(null);
    setListScreen('all');
    setScreen('all');
  };

  const openEdit = (targetCourse, dish) => {
    setCourseKey(targetCourse);
    setEditingDish(dish);
    setScreen('edit');
  };

  // Edit from Home search: come back to that dish's course page afterwards
  const openEditFromHome = (targetCourse, dish) => {
    setListScreen('course');
    openEdit(targetCourse, dish);
  };

  // save handlers 
  const handleAddDish = (targetCourse, dish) => {
    setMenu((prev) => ({ ...prev, [targetCourse]: [...prev[targetCourse], dish] }));
    const title = COURSES.find((c) => c.key === targetCourse).title;
    setHighlight({ id: dish.id, label: 'new' });
    setToast(`${dish.name} was added to ${title}.`);
    if (listScreen === 'all') {
      setScreen('all');
    } else {
      setCourseKey(targetCourse); // show the course the dish was added to
      setScreen('course');
    }
  };

  const handleEditDish = (targetCourse, updated) => {
    setMenu((prev) => ({
      ...prev,
      [targetCourse]: prev[targetCourse].map((d) => (d.id === updated.id ? updated : d)),
    }));
    setHighlight({ id: updated.id, label: 'updated' });
    setToast(`${updated.name} was updated successfully.`);
    setScreen(listScreen);
  };

  // Remove a menu item from its course
  const handleRemoveDish = (targetCourse, dish) => {
    setMenu((prev) => ({
      ...prev,
      [targetCourse]: prev[targetCourse].filter((item) => item.id !== dish.id),
    }));
    setHighlight(null);
    setToast(`${dish.name} was removed from the menu.`);
  };

  // Every Remove button should ask for confirmation first
  const askToRemove = (targetCourse, dish) => setPendingRemoval({ targetCourse, dish });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {screen === 'home' && (
        <HomeScreen
          menu={menu}
          onOpenCourse={openCourse}
          onOpenAll={openAll}
          onOpenStats={() => setScreen('stats')}
          onEdit={openEditFromHome}
          onRemove={askToRemove}
        />
      )}

      {screen === 'course' && (
        <CourseScreen
          courseKey={courseKey}
          menu={menu}
          highlight={highlight}
          onBack={() => setScreen('home')}
          onAdd={() => setScreen('add')}
          onEdit={openEdit}
          onRemove={askToRemove}
        />
      )}

      {screen === 'all' && (
        <AllItemsScreen
          menu={menu}
          highlight={highlight}
          onBack={() => setScreen('home')}
          onAdd={() => setScreen('add')}
          onEdit={openEdit}
          onRemove={askToRemove}
        />
      )}

      {screen === 'stats' && <StatisticsScreen menu={menu} onBack={() => setScreen('home')} />}

      {screen === 'add' && (
        <AddScreen
          defaultCourse={listScreen === 'all' ? '' : courseKey}
          menu={menu}
          onSave={handleAddDish}
          onBack={() => setScreen(listScreen)}
        />
      )}

      {screen === 'edit' && editingDish && (
        <EditScreen
          courseKey={courseKey}
          dish={editingDish}
          menu={menu}
          onSave={handleEditDish}
          onBack={() => setScreen(listScreen)}
        />
      )}

      {/* Confirmation for every Remove button */}
      <ConfirmModal
        visible={!!pendingRemoval}
        title="Remove menu item?"
        message={
          pendingRemoval
            ? `Are you sure you want to permanently remove "${pendingRemoval.dish.name}"?`
            : ''
        }
        confirmLabel="Remove"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) handleRemoveDish(pendingRemoval.targetCourse, pendingRemoval.dish);
          setPendingRemoval(null);
        }}
      />

      <Toast message={toast} onHide={hideToast} />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // background
  background: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  backgroundImage: { top: undefined, height: '65%', bottom: 0 },

  // buttons
  pill: {
    backgroundColor: COLORS.button,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pillSmall: { paddingVertical: 6, paddingHorizontal: 18 },
  pillText: { color: COLORS.buttonText, fontFamily: Fonts.body, fontSize: 16, fontWeight: '600' },
  pillTextSmall: { fontSize: 13 },

  // back link
  backLink: { paddingHorizontal: 16, paddingTop: 12, alignSelf: 'flex-start' },
  backLinkText: { color: COLORS.title, fontFamily: Fonts.body, fontSize: 15, fontWeight: '600' },

  // home
  homeContent: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  homeTitle: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.title,
    textAlign: 'center',
    marginBottom: 20,
  },
  homeSectionTitle: { fontFamily: Fonts.heading, fontSize: 20, color: COLORS.title, marginTop: 8, marginBottom: 10 },
  searchInput: {
    width: '100%',
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  filterLabel: { fontSize: 14, color: COLORS.mutedText, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 },
  filterButton: { marginHorizontal: 4, marginBottom: 8 },
  resultsWrap: { width: '100%', marginTop: 8 },
  resultsHeading: { fontSize: 16, fontWeight: '600', color: COLORS.title, marginBottom: 10, textAlign: 'center' },
  clearButton: { alignSelf: 'center', marginTop: 8, backgroundColor: COLORS.inputBorder },
  statsButton: { marginTop: 24, minWidth: 180 },

  screenTitle: { fontFamily: Fonts.heading, fontSize: 28, color: COLORS.title, textAlign: 'center', marginBottom: 20 },

  // lists
  listContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },
  emptyText: { textAlign: 'center', color: COLORS.mutedText, fontFamily: Fonts.body, marginVertical: 20 },
  courseSection: { marginBottom: 16 },
  courseSectionTitle: { fontFamily: Fonts.heading, fontSize: 20, color: COLORS.title, marginBottom: 6 },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 241, 243, 0.85)',
  },
  dishRowHighlight: {
    backgroundColor: 'rgba(201, 154, 170, 0.25)',
    borderWidth: 1,
    borderColor: COLORS.button,
  },
  dishInfo: { flex: 1, paddingRight: 12 },
  dishName: { fontFamily: Fonts.body, fontSize: 15, fontWeight: '600', color: COLORS.text },
  dishPrice: { fontFamily: Fonts.body, fontSize: 14, color: COLORS.text, marginVertical: 2 },
  dishDescription: { fontFamily: Fonts.body, fontSize: 13, color: COLORS.text, lineHeight: 18 },
  badge: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  actionButtons: { alignItems: 'stretch' },
  removeButton: { marginTop: 6, backgroundColor: COLORS.error },
  removeButtonText: { color: '#FFFFFF' },
  bottomButton: { alignSelf: 'center', minWidth: 140, marginTop: 24 },

  // statistics
  statsContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  statCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  statLabel: { fontSize: 14, color: COLORS.mutedText },
  statValue: { fontFamily: Fonts.heading, fontSize: 28, color: COLORS.title, marginTop: 4 },
  statsSubheading: { fontFamily: Fonts.heading, fontSize: 20, color: COLORS.title, marginTop: 12, marginBottom: 8 },
  courseStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  courseStatName: { fontSize: 15, color: COLORS.text },
  courseStatCount: { fontSize: 15, color: COLORS.text, fontWeight: '600' },

  // forms
  formContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  fieldWrap: { marginBottom: 18 },
  input: {
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: COLORS.text,
  },
  inputMultiline: { minHeight: 110 },
  inputError: { borderColor: COLORS.error, borderWidth: 1.5 },
  errorText: { color: COLORS.error, fontFamily: Fonts.body, fontSize: 12, marginTop: 4 },
  hintText: { color: COLORS.mutedText, fontFamily: Fonts.body, fontSize: 12, marginTop: 4 },
  formErrorSummary: {
    color: COLORS.error,
    backgroundColor: '#FDECEA',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },

  // confirmation modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { width: '100%', maxWidth: 340, backgroundColor: COLORS.card, borderRadius: 14, padding: 22, alignItems: 'center' },
  modalTitle: { fontFamily: Fonts.heading, fontSize: 22, color: COLORS.title, marginBottom: 8 },
  modalMessage: { fontFamily: Fonts.body, fontSize: 14, color: COLORS.text, textAlign: 'center', marginBottom: 18 },
  modalButtons: { flexDirection: 'row' },
  modalCancel: { backgroundColor: COLORS.inputBorder, marginRight: 12 },

  // toast
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  toastText: { color: '#fff', fontFamily: Fonts.body, fontSize: 14, textAlign: 'center' },
});