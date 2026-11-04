
import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "/absproxy/5173/api";

const styles = `
.appointments-page {
  min-height: 100vh;
  background: #f6f8f5;
  padding: 35px 6%;
  color: #26382f;
  font-family: Arial, sans-serif;
}

.ap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.ap-header h1 { margin: 0 0 8px; }
.ap-header p, .ap-muted { color: #718078; }

.ap-back {
  color: #34745b;
  text-decoration: none;
  font-weight: 600;
}

.ap-card {
  background: white;
  border: 1px solid #e5ebe5;
  border-radius: 14px;
  padding: 23px;
  margin-bottom: 22px;
  box-shadow: 0 3px 12px rgba(20,50,30,.04);
}

.ap-card h2 { margin-top: 0; }

.ap-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 16px;
}

.ap-field { display: flex; flex-direction: column; gap: 7px; }
.ap-field.full { grid-column: 1 / -1; }
.ap-field label { font-weight: 600; font-size: 14px; }

.ap-field input, .ap-field select, .ap-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px;
  border: 1px solid #d7e0d9;
  border-radius: 8px;
  font: inherit;
  background: white;
}

.ap-field textarea { min-height: 85px; resize: vertical; }

.ap-button {
  border: 0;
  border-radius: 8px;
  padding: 11px 17px;
  cursor: pointer;
  font-weight: 600;
  background: #34745b;
  color: white;
}

.ap-button:disabled { opacity: .55; cursor: not-allowed; }
.ap-button.secondary { background: #e8eee9; color: #315b46; }
.ap-button.danger { background: #a94444; }
.ap-actions { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 14px; }
.ap-list { display: grid; grid-template-columns: repeat(auto-fit,minmax(270px,1fr)); gap: 16px; }
.ap-item { border: 1px solid #e4ebe5; border-radius: 11px; padding: 17px; }
.ap-item h3 { margin: 0 0 12px; }
.ap-item p { margin: 7px 0; color: #66766d; font-size: 14px; }

.ap-status {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  background: #edf1ed;
  color: #456052;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.ap-status.confirmed { background: #e0f3e7; color: #237044; }
.ap-status.pending { background: #fff2d9; color: #94651d; }
.ap-status.rejected, .ap-status.cancelled { background: #fbe7e7; color: #a13e3e; }
.ap-notice { padding: 12px; border-radius: 8px; margin-bottom: 18px; background: #edf4ef; }
.ap-error { background: #fff0f0; color: #a13e3e; }
.ap-message { width: 100%; box-sizing: border-box; padding: 9px; border: 1px solid #ddd; border-radius: 7px; margin-top: 10px; }

.ap-preselected {
  padding: 12px 14px;
  margin-bottom: 17px;
  border-radius: 8px;
  background: #edf4ef;
  color: #315b46;
  font-size: 14px;
}

@media(max-width:650px) {
  .appointments-page { padding: 22px 15px; }
  .ap-form { grid-template-columns: 1fr; }
  .ap-field.full { grid-column: auto; }
}
`;

function localDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function displayDate(value) {
  if (!value) return "Date unavailable";

  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? datePart
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
}

function getCounselorName(profile) {
  return profile?.user?.name ||
    profile?.counselor?.name ||
    profile?.name ||
    "Counselor";
}

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export default function Appointments() {

  const { user, token } = useAuth();

  const [searchParams] = useSearchParams();

  const preselectedCounselorId =
    searchParams.get("counselor") || "";

  const preselectionApplied = useRef(false);

  const isCounselor = user?.role === "counselor";

  const [appointments, setAppointments] = useState([]);
  const [counselors, setCounselors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    counselorProfileId: "",
    appointmentDate: "",
    startTime: "",
    consultationMode: "online",
    reason: ""
  });

  const [messages, setMessages] = useState({});

  // ======================================
  // LOAD APPOINTMENTS AND COUNSELORS
  // ======================================

  async function loadData() {

    if (!token) return;

    setLoading(true);
    setError("");

    try {

      if (isCounselor) {

        const data = await apiRequest(
          "/appointments/counselor",
          token
        );

        setAppointments(data.appointments || []);

      } else {

        const [appointmentData, counselorData] = await Promise.all([
          apiRequest("/appointments/my", token),
          apiRequest("/counselors", token)
        ]);

        setAppointments(appointmentData.appointments || []);

        const profiles =
          counselorData.counselors ||
          counselorData.profiles ||
          [];

        setCounselors(profiles);
      }

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token, user?.role]);

  // ======================================
  // PRESELECT COUNSELOR FROM DIRECTORY
  // ======================================

  useEffect(() => {

    if (
      isCounselor ||
      preselectionApplied.current ||
      !preselectedCounselorId ||
      counselors.length === 0
    ) {
      return;
    }

    const matchedCounselor = counselors.find(
      (profile) =>
        String(profile._id) === String(preselectedCounselorId)
    );

    // Mark this selection as handled so refreshing
    // appointment data does not overwrite later messages.
    preselectionApplied.current = true;

    if (!matchedCounselor) {

      setError(
        "The selected counselor is unavailable. Please choose another counselor."
      );

      return;
    }

    setForm((previous) => ({
      ...previous,

      counselorProfileId: matchedCounselor._id,

      consultationMode:
        matchedCounselor.consultationMode === "both"
          ? previous.consultationMode
          : matchedCounselor.consultationMode || "online"
    }));

    setNotice(
      `You selected ${getCounselorName(matchedCounselor)}. Choose your preferred date and time to continue.`
    );

  }, [
    isCounselor,
    counselors,
    preselectedCounselorId
  ]);

  // ======================================
  // UPDATE FORM
  // ======================================

  function updateForm(event) {

    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  // ======================================
  // BOOK APPOINTMENT
  // ======================================

  async function bookAppointment(event) {

    event.preventDefault();

    setError("");
    setNotice("");

    if (
      !form.counselorProfileId ||
      !form.appointmentDate ||
      !form.startTime
    ) {

      setError("Please complete all required appointment fields.");

      return;
    }

    setSubmitting(true);

    try {

      const data = await apiRequest("/appointments", token, {
        method: "POST",
        body: JSON.stringify(form)
      });

      setNotice(
        data.message || "Appointment request submitted."
      );

      setForm({
        counselorProfileId: "",
        appointmentDate: "",
        startTime: "",
        consultationMode: "online",
        reason: ""
      });

      await loadData();

    } catch (err) {

      setError(err.message);

    } finally {

      setSubmitting(false);
    }
  }

  // ======================================
  // CANCEL APPOINTMENT
  // ======================================

  async function cancelAppointment(id) {

    if (!window.confirm("Cancel this appointment?")) return;

    setError("");
    setNotice("");

    try {

      const data = await apiRequest(
        `/appointments/${id}/cancel`,
        token,
        { method: "PATCH" }
      );

      setNotice(
        data.message || "Appointment cancelled."
      );

      await loadData();

    } catch (err) {

      setError(err.message);
    }
  }

  // ======================================
  // COUNSELOR RESPONDS TO APPOINTMENT
  // ======================================

  async function respondToAppointment(id, status) {

    setError("");
    setNotice("");

    try {

      const data = await apiRequest(
        `/appointments/${id}/respond`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            counselorMessage: messages[id] || ""
          })
        }
      );

      setNotice(
        data.message || "Appointment updated."
      );

      await loadData();

    } catch (err) {

      setError(err.message);
    }
  }

  // ======================================
  // SELECTED COUNSELOR
  // ======================================

  const selectedCounselor = counselors.find(
    (item) =>
      String(item._id) === String(form.counselorProfileId)
  );

  const availableModes =
    selectedCounselor?.consultationMode === "both"
      ? ["online", "in-person"]
      : [selectedCounselor?.consultationMode || "online"];

  // ======================================
  // UI
  // ======================================

  return (
    <div className="appointments-page">

      <style>{styles}</style>

      <header className="ap-header">

        <div>

          <h1>
            {isCounselor
              ? "Manage Appointments"
              : "My Appointments"}
          </h1>

          <p className="ap-muted">
            {isCounselor
              ? "Review and respond to appointment requests."
              : "Book and manage your counseling sessions."}
          </p>

        </div>

        <Link to="/" className="ap-back">
          Back to Dashboard
        </Link>

      </header>

      {error && (
        <div className="ap-notice ap-error">
          {error}
        </div>
      )}

      {notice && (
        <div className="ap-notice">
          {notice}
        </div>
      )}

      {/* USER BOOKING FORM */}
      {!isCounselor && (

        <section className="ap-card">

          <h2>Book an appointment</h2>

          <p className="ap-muted">
            Select an approved counselor and request a suitable session.
          </p>

          {selectedCounselor && (
            <div className="ap-preselected">
              Selected counselor:{" "}
              <strong>
                {getCounselorName(selectedCounselor)}
              </strong>
            </div>
          )}

          {counselors.length === 0 && !loading && (
            <p className="ap-muted">
              No approved counselor profiles are currently available.
            </p>
          )}

          <form
            className="ap-form"
            onSubmit={bookAppointment}
          >

            <div className="ap-field full">

              <label htmlFor="counselorProfileId">
                Select counselor
              </label>

              <select
                id="counselorProfileId"
                name="counselorProfileId"
                value={form.counselorProfileId}
                onChange={updateForm}
                required
              >

                <option value="">
                  Choose a counselor
                </option>

                {counselors.map((profile) => (

                  <option
                    key={profile._id}
                    value={profile._id}
                  >
                    {getCounselorName(profile)}
                    {" — "}
                    {(profile.specialization || []).join(", ")}
                  </option>

                ))}

              </select>

            </div>

            <div className="ap-field">

              <label htmlFor="appointmentDate">
                Appointment date
              </label>

              <input
                id="appointmentDate"
                type="date"
                name="appointmentDate"
                min={localDateString()}
                value={form.appointmentDate}
                onChange={updateForm}
                required
              />

            </div>

            <div className="ap-field">

              <label htmlFor="startTime">
                Start time
              </label>

              <input
                id="startTime"
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={updateForm}
                required
              />

            </div>

            <div className="ap-field full">

              <label htmlFor="consultationMode">
                Consultation mode
              </label>

              <select
                id="consultationMode"
                name="consultationMode"
                value={form.consultationMode}
                onChange={updateForm}
              >

                {availableModes.map((mode) => (

                  <option
                    key={mode}
                    value={mode}
                  >
                    {mode === "online" ? "Online" : "In person"}
                  </option>

                ))}

              </select>

            </div>

            <div className="ap-field full">

              <label htmlFor="reason">
                Reason for appointment
              </label>

              <textarea
                id="reason"
                name="reason"
                maxLength={1000}
                value={form.reason}
                onChange={updateForm}
                placeholder="Briefly describe what you would like support with..."
              />

            </div>

            <div className="ap-field full">

              <button
                className="ap-button"
                type="submit"
                disabled={
                  submitting ||
                  counselors.length === 0
                }
              >
                {submitting
                  ? "Submitting..."
                  : "Request Appointment"}
              </button>

            </div>

          </form>

        </section>

      )}

      {/* APPOINTMENT HISTORY */}
      <section className="ap-card">

        <h2>
          {isCounselor
            ? "Appointment requests"
            : "Appointment history"}
        </h2>

        {loading ? (

          <p className="ap-muted">
            Loading appointments...
          </p>

        ) : appointments.length === 0 ? (

          <p className="ap-muted">
            {isCounselor
              ? "You have no appointment requests."
              : "You have not booked any appointments yet."}
          </p>

        ) : (

          <div className="ap-list">

            {appointments.map((appointment) => {

              const otherPerson = isCounselor
                ? appointment.user
                : appointment.counselor;

              return (

                <article
                  className="ap-item"
                  key={appointment._id}
                >

                  <h3>
                    {otherPerson?.name || "Counselor / User"}
                  </h3>

                  <span
                    className={`ap-status ${appointment.status}`}
                  >
                    {appointment.status}
                  </span>

                  <p>
                    <strong>Date:</strong>{" "}
                    {displayDate(appointment.appointmentDate)}
                  </p>

                  <p>
                    <strong>Time:</strong>{" "}
                    {appointment.startTime} – {appointment.endTime}
                  </p>

                  <p>
                    <strong>Mode:</strong>{" "}
                    {appointment.consultationMode}
                  </p>

                  {appointment.reason && (
                    <p>
                      <strong>Reason:</strong>{" "}
                      {appointment.reason}
                    </p>
                  )}

                  {appointment.counselorMessage && (
                    <p>
                      <strong>Counselor message:</strong>{" "}
                      {appointment.counselorMessage}
                    </p>
                  )}

                  {/* COUNSELOR ACTIONS */}
                  {isCounselor &&
                    appointment.status === "pending" && (

                      <>

                        <textarea
                          className="ap-message"
                          value={messages[appointment._id] || ""}
                          maxLength={500}
                          placeholder="Optional message to the user"
                          onChange={(event) =>
                            setMessages({
                              ...messages,
                              [appointment._id]: event.target.value
                            })
                          }
                        />

                        <div className="ap-actions">

                          <button
                            className="ap-button"
                            onClick={() =>
                              respondToAppointment(
                                appointment._id,
                                "confirmed"
                              )
                            }
                          >
                            Confirm
                          </button>

                          <button
                            className="ap-button danger"
                            onClick={() =>
                              respondToAppointment(
                                appointment._id,
                                "rejected"
                              )
                            }
                          >
                            Reject
                          </button>

                        </div>

                      </>
                    )}

                  {/* USER CANCELLATION */}
                  {!isCounselor &&
                    ["pending", "confirmed"].includes(appointment.status) && (

                      <div className="ap-actions">

                        <button
                          className="ap-button danger"
                          onClick={() =>
                            cancelAppointment(appointment._id)
                          }
                        >
                          Cancel appointment
                        </button>

                      </div>

                    )}

                </article>

              );
            })}

          </div>

        )}

      </section>

      <p className="ap-muted">
        MindCare Connect provides wellness support and does not replace
        professional mental healthcare.
      </p>

    </div>
  );
}
