import { useEffect, useMemo, useState } from "react";
import { getCollection, sendAdminRequest, sendAuthRequest } from "./services/api";
import "./App.css";

function App() {
  const [page, setPage] = useState(() => localStorage.getItem("lankaUser") ? "places" : "login");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("lankaUser") || "null"));
  const [places, setPlaces] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tripItems, setTripItems] = useState([]);
  const [transportCost, setTransportCost] = useState(0);
  const [placeSearch, setPlaceSearch] = useState("");
  const [placeCity, setPlaceCity] = useState("All");
  const [adminType, setAdminType] = useState("places");
  const [eventDates, setEventDates] = useState({ startDate: "", endDate: "" });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [placeData, hotelData, eventData] = await Promise.all([getCollection("places"), getCollection("hotels"), getCollection("events")]);
        setPlaces(placeData);
        setHotels(hotelData);
        setEvents(eventData);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const goTo = (nextPage) => { setNotice(""); setPage(nextPage); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const visiblePlaces = useMemo(() => places.filter((place) => (placeCity === "All" || place.location === placeCity) && place.name.toLowerCase().includes(placeSearch.toLowerCase())), [places, placeCity, placeSearch]);
  const total = tripItems.reduce((sum, item) => sum + item.price * item.nights, 0) + Number(transportCost || 0);

  const addToTrip = (item, type) => {
    const id = item._id || item.id;
    if (tripItems.some((tripItem) => tripItem.id === id)) return setNotice(`${item.name} is already in My Trip.`);
    const price = type === "hotel" ? item.pricePerNight : item.estimatedCost;
    setTripItems([...tripItems, { id, name: item.name, type, price, nights: 1, emoji: type === "place" ? "📍" : type === "hotel" ? "🏨" : item.emoji }]);
    setNotice(`${item.name} was added to My Trip.`);
  };

  const handleAuth = async (event, action) => {
    event.preventDefault();
    try {
      const result = await sendAuthRequest(action, Object.fromEntries(new FormData(event.currentTarget).entries()));
      if (action === "register") { goTo("login"); setNotice("Registration successful. Please log in."); return; }
      localStorage.setItem("lankaToken", result.token);
      localStorage.setItem("lankaUser", JSON.stringify(result.user));
      setUser(result.user);
      goTo(result.user.role === "admin" ? "admin" : "places");
    } catch (authError) { setNotice(authError.message); }
  };

  const logout = () => { localStorage.removeItem("lankaToken"); localStorage.removeItem("lankaUser"); setUser(null); goTo("home"); };
  const createAdminItem = async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = { ...form };
    if (adminType === "places") { payload.estimatedCost = Number(payload.estimatedCost); payload.estimatedDuration = Number(payload.estimatedDuration); }
    if (adminType === "hotels") { payload.pricePerNight = Number(payload.pricePerNight); if (payload.rating) payload.rating = Number(payload.rating); }
    if (adminType === "events") payload.estimatedCost = Number(payload.estimatedCost || 0);
    try {
      const created = await sendAdminRequest(adminType, payload, localStorage.getItem("lankaToken"));
      if (adminType === "places") setPlaces([...places, created]);
      if (adminType === "hotels") setHotels([...hotels, created]);
      setNotice(`${created.name} was created successfully.`);
      event.currentTarget.reset();
    } catch (createError) { setNotice(createError.message); }
  };
  const filterEvents = async () => {
    if (!eventDates.startDate || !eventDates.endDate) return setNotice("Please select both travel dates.");
    try {
      const eventData = await getCollection(`events?startDate=${eventDates.startDate}&endDate=${eventDates.endDate}`);
      setEvents(eventData);
      setNotice(`${eventData.length} matching event(s) found.`);
    } catch (eventError) { setNotice(eventError.message); }
  };
  const heading = (eyebrow, title, copy) => <section className="page-heading"><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></section>;
  const Card = ({ item, type }) => {
    const city = item.location;
    const cost = type === "hotel" ? item.pricePerNight : item.estimatedCost;
    const emoji = type === "place" ? "📍" : type === "hotel" ? "🏨" : item.emoji;
    return <article className="card"><div className="card-icon">{emoji}</div><div className="card-content"><span className="tag">{city} · {item.category || type}</span><h3>{item.name}</h3><p>{type === "hotel" ? `★ ${item.rating ?? "New"} · Rs. ${Number(cost).toLocaleString()} / night` : type === "place" ? `Rs. ${Number(cost).toLocaleString()} · ${item.estimatedDuration} hours` : `${item.date || new Date(item.startDate).toLocaleDateString()} · Rs. ${Number(cost).toLocaleString()}`}</p><button className="text-button" onClick={() => addToTrip(item, type)}>+ Add to My Trip</button></div></article>;
  };

  const dataState = (items, emptyText) => loading ? <div className="empty-state"><h2>Loading information…</h2></div> : error ? <div className="empty-state"><h2>Could not load data</h2><p>{error}</p><button onClick={() => window.location.reload()}>Try again</button></div> : items.length ? <section className="card-grid">{items}</section> : <div className="empty-state"><h2>{emptyText}</h2><p>An admin can add content through the API.</p></div>;

  const content = () => {
    if (page === "places") return <main className="page">{heading("EXPLORE", "Places to visit", "Live place data from the LankaExplore backend.")}<section className="filters"><input value={placeSearch} onChange={(event) => setPlaceSearch(event.target.value)} placeholder="Search places" /><select value={placeCity} onChange={(event) => setPlaceCity(event.target.value)}><option>All</option><option>Kandy</option><option>Anuradhapura</option></select></section>{dataState(visiblePlaces.map((place) => <Card key={place._id} item={place} type="place" />), "No places match your search.")}</main>;
    if (page === "hotels") return <main className="page">{heading("STAY", "Hotels", "Live hotel data from the LankaExplore backend.")}{dataState(hotels.map((hotel) => <Card key={hotel._id} item={hotel} type="hotel" />), "No hotels have been added yet.")}</main>;
    if (page === "events") return <main className="page">{heading("WHAT'S ON", "Events", "Live event data with travel-date filtering.")}<section className="date-panel"><label>Visiting from<input type="date" value={eventDates.startDate} onChange={(event) => setEventDates({ ...eventDates, startDate: event.target.value })} /></label><label>Visiting to<input type="date" value={eventDates.endDate} onChange={(event) => setEventDates({ ...eventDates, endDate: event.target.value })} /></label><button onClick={filterEvents}>Find events</button></section>{dataState(events.map((event) => <Card key={event._id} item={event} type="event" />), "No matching events found.")}</main>;
    if (page === "trip") return <main className="page">{heading("YOUR PLAN", "My Trip", "Local planning preview until the Trip API is ready.")}<section className="trip-layout"><div className="trip-list">{tripItems.length === 0 ? <div className="empty-state"><div>🧳</div><h2>Your trip is empty</h2><p>Add a place, hotel, or event to start planning.</p><button onClick={() => goTo("places")}>Explore places</button></div> : tripItems.map((item) => <div className="trip-item" key={item.id}><div><strong>{item.emoji} {item.name}</strong><span>{item.type} · Rs. {(item.price * item.nights).toLocaleString()}</span></div>{item.type === "hotel" && <label>Nights <input type="number" min="1" value={item.nights} onChange={(event) => setTripItems(tripItems.map((tripItem) => tripItem.id === item.id ? { ...tripItem, nights: Number(event.target.value) } : tripItem))} /></label>}<button className="remove" onClick={() => setTripItems(tripItems.filter((tripItem) => tripItem.id !== item.id))}>Remove</button></div>)}</div><aside className="cost-card"><h2>Estimated cost</h2><label>Transportation cost (Rs.)<input type="number" min="0" value={transportCost} onChange={(event) => setTransportCost(event.target.value)} /></label><div className="total"><span>Total estimate</span><strong>Rs. {total.toLocaleString()}</strong></div><small>This is an estimate only. LankaExplore does not process bookings or payments.</small></aside></section></main>;
    if (page === "login" || page === "register") { const isLogin = page === "login"; return <main className="auth-page"><form className="auth-card" onSubmit={(event) => handleAuth(event, isLogin ? "login" : "register")}><span>{isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}</span><h1>{isLogin ? "Log in to LankaExplore" : "Start planning your trip"}</h1><p>{isLogin ? "Use your account to manage your personal trip." : "Create a free tourist account in a few seconds."}</p>{!isLogin && <label>Full name<input name="name" required placeholder="Your name" /></label>}<label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" required placeholder="Your password" /></label><button type="submit">{isLogin ? "Log in" : "Create account"}</button><p className="auth-switch">{isLogin ? "New to LankaExplore?" : "Already have an account?"} <button type="button" className="link-button" onClick={() => goTo(isLogin ? "register" : "login")}>{isLogin ? "Register" : "Log in"}</button></p></form></main>; }
    if (page === "admin") return <main className="page">{heading("ADMIN AREA", "Dashboard", "Only admin accounts can create tourism content.")}{user?.role === "admin" ? <><section className="admin-grid"><div className="stat-card"><strong>{places.length}</strong><span>Places</span></div><div className="stat-card"><strong>{hotels.length}</strong><span>Hotels</span></div><div className="stat-card"><strong>{events.length}</strong><span>Events</span></div></section><form className="admin-form" onSubmit={createAdminItem}><h2>Create new content</h2><label>Content type<select value={adminType} onChange={(event) => setAdminType(event.target.value)}><option value="places">Place</option><option value="hotels">Hotel</option><option value="events">Event</option></select></label><label>Name<input name="name" required placeholder="Name" /></label><label>Description<textarea name="description" required placeholder="Short description" /></label><label>Location<select name="location" required><option value="Kandy">Kandy</option><option value="Anuradhapura">Anuradhapura</option></select></label>{adminType === "places" && <><label>Category<select name="category"><option>History</option><option>Culture</option><option>Nature</option><option>Religious</option><option>Adventure</option></select></label><label>Estimated cost (Rs.)<input name="estimatedCost" type="number" min="0" required /></label><label>Estimated duration (hours)<input name="estimatedDuration" type="number" min="0" required /></label></>}{adminType === "hotels" && <><label>Price per night (Rs.)<input name="pricePerNight" type="number" min="0" required /></label><label>Rating (optional)<input name="rating" type="number" min="0" max="5" step="0.1" /></label></>}{adminType === "events" && <><label>Category<input name="category" required placeholder="Cultural, Religious, Festival…" /></label><label>Start date<input name="startDate" type="date" required /></label><label>End date<input name="endDate" type="date" required /></label><label>Estimated cost (Rs.)<input name="estimatedCost" type="number" min="0" /></label></>}<label>Image URL (optional)<input name="imageUrl" type="url" placeholder="https://…" /></label>{adminType !== "events" && <label>Address (optional)<input name="address" placeholder="Address" /></label>}<button type="submit">Create {adminType.slice(0, -1)}</button></form></> : <div className="empty-state"><div>🔒</div><h2>Admin access required</h2><p>Please log in with an admin account.</p><button onClick={() => goTo("login")}>Log in</button></div>}</main>;
    return <main><section className="hero-section"><div><span className="eyebrow">PLAN SRI LANKA, SIMPLY</span><h1>Discover more. <em>Plan better.</em></h1><p>LankaExplore helps visitors find places, hotels, and events in Kandy and Anuradhapura.</p><div className="hero-actions"><button onClick={() => goTo("places")}>Explore places</button><button className="outline" onClick={() => goTo("events")}>Find events</button></div></div><div className="hero-visual"><div className="sun">☀️</div><div className="landmark">🛕</div><div className="location-card">📍 <b>Kandy & Anuradhapura</b><small>Two unforgettable destinations</small></div></div></section><section className="feature-section"><div className="section-intro"><span>HOW IT WORKS</span><h2>Your trip, in three easy steps.</h2></div><div className="steps"><div><b>01</b><h3>Explore</h3><p>Browse attractions, hotels, and local events.</p></div><div><b>02</b><h3>Build your trip</h3><p>Add the things that interest you to your plan.</p></div><div><b>03</b><h3>Estimate costs</h3><p>See a simple total before you travel.</p></div></div></section></main>;
  };

  return <div className="app-shell"><header><button className="brand" onClick={() => goTo("home")}>Lanka<span>Explore</span></button><nav><button onClick={() => goTo("places")}>Places</button><button onClick={() => goTo("hotels")}>Hotels</button><button onClick={() => goTo("events")}>Events</button><button onClick={() => goTo("trip")}>My Trip <span className="trip-count">{tripItems.length}</span></button></nav><div className="account-actions">{user ? <><button className="user-name" onClick={() => goTo(user.role === "admin" ? "admin" : "trip")}>Hi, {user.name.split(" ")[0]}</button><button className="logout" onClick={logout}>Log out</button></> : <><button className="login" onClick={() => goTo("login")}>Log in</button><button className="register" onClick={() => goTo("register")}>Register</button></>}</div></header>{notice && <div className="notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}{content()}<footer><b>LankaExplore</b><span>Plan your Kandy and Anuradhapura journey with confidence.</span></footer></div>;
}

export default App;
