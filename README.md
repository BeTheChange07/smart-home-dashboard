# Smart Home Dashboard (class project)

A team project from my M.S. at UT Dallas. We built a pretend smart home to test how notification priority affects whether people trust it, with 5 study participants.

My part was connecting the React front end to the Flask backend, the priority and daily batch notifications, web push, and file locking so two changes landing at once can't corrupt the saved state.

- `Frontend/`: the React dashboard
- `Backend/`: the Flask API, notifications and saved device state

To run the front end on a host other than localhost, set `VITE_ALLOWED_HOST` to that hostname.
