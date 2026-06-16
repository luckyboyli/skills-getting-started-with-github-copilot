document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear previous options (keep the placeholder option)
      while (activitySelect.options.length > 1) activitySelect.remove(1);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // Clamp spotsLeft to zero so negative values are not shown
        const rawSpots = details.max_participants - details.participants.length;
        const spotsLeft = rawSpots > 0 ? rawSpots : 0;

        // Basic info
        const title = document.createElement('h4');
        title.textContent = name;
        const desc = document.createElement('p');
        desc.className = 'activity-desc';
        desc.textContent = details.description;
        const sched = document.createElement('p');
        sched.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const avail = document.createElement('p');
        avail.className = 'availability';
        if (spotsLeft > 0) {
          avail.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        } else {
          avail.innerHTML = `<strong>Availability:</strong> <span class="full">Full</span>`;
        }

        // Participants list (use DOM methods to avoid HTML injection and formatting issues)
        let participantsContainer;
        if (details.participants && details.participants.length) {
          const heading = document.createElement('p');
          heading.className = 'participants-heading';
          heading.innerHTML = `<strong>Participants (${details.participants.length}):</strong>`;

          const ul = document.createElement('ul');
          ul.className = 'participants-list';
          details.participants.forEach(p => {
            const li = document.createElement('li');
            li.textContent = p;
            ul.appendChild(li);
          });

          participantsContainer = document.createElement('div');
          participantsContainer.appendChild(heading);
          participantsContainer.appendChild(ul);
        } else {
          const no = document.createElement('p');
          no.className = 'no-participants';
          no.textContent = 'No participants yet';
          participantsContainer = no;
        }

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(sched);
        activityCard.appendChild(avail);
        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
