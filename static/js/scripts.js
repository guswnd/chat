document.addEventListener('DOMContentLoaded', function () {
  const createProfileBtn = document.getElementById('create-profile-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const profileForm = document.getElementById('profile-form');
  const profilePopup = document.getElementById('profile-popup');
  const profileContainer = document.getElementById('profile-container');

  createProfileBtn.addEventListener('click', openProfilePopup);
  cancelBtn.addEventListener('click', closeProfilePopup);
  profileForm.addEventListener('submit', saveProfile);

  function openProfilePopup() {
    profilePopup.classList.remove('hidden');
  }

  function closeProfilePopup() {
    profilePopup.classList.add('hidden');
  }

  function saveProfile(event) {
    event.preventDefault();

    const formData = new FormData(profileForm);
    
    fetch('/add_profile', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const profileId = data.profile_id;
            const name = formData.get('name');
            const bio = formData.get('bio');
            const photoInput = document.getElementById('photo');
            const file = photoInput.files && photoInput.files[0];

            const profileCard = createProfileCard(name, bio, file, profileId);

            profileContainer.appendChild(profileCard);
            closeProfilePopup();
            profileForm.reset();
        } else {
            console.error('프로필 저장 중 오류가 발생했습니다.');
        }
    })
    .catch(error => {
        console.error('프로필 저장 중 오류가 발생했습니다.', error);
    });
  }

  profileContainer.addEventListener('click', function (event) {
    if (event.target.closest('.edit-btn')) {
      const targetProfile = event.target.closest('.profile-card');
      openEditProfilePopup(targetProfile);
  } else if (event.target.closest('.delete-btn')) {
      const targetProfile = event.target.closest('.profile-card');
      deleteProfile(targetProfile);
  } else if (event.target.closest('.select-btn')) {
      const targetProfile = event.target.closest('.profile-card');
      selectProfile(targetProfile);
  }
});;
  

  function createProfileCard(name, bio, file, id) {
    const profileCard = document.createElement('div');
    profileCard.classList.add('profile-card');
    profileCard.setAttribute('data-profile-id', id);

    const profileImage = document.createElement('img');
    const profileName = document.createElement('h3');
    const profileBio = document.createElement('p');
    const editBtn = document.createElement('button');
    const deleteBtn = document.createElement('button');
    const selectBtn = document.createElement('button');
    selectBtn.classList.add('select-btn');
    selectBtn.innerText = '선택';
    profileCard.appendChild(selectBtn);

    profileName.innerText = name;
    profileBio.innerText = bio;

    editBtn.classList.add('edit-btn');
    editBtn.innerText = '수정';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerText = '삭제';

    profileCard.appendChild(profileImage);
    profileCard.appendChild(profileName);
    profileCard.appendChild(profileBio);
    profileCard.appendChild(editBtn);
    profileCard.appendChild(deleteBtn);

    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            profileImage.src = event.target.result;
            profileImage.width = 200;
            profileImage.height = 200;
        };
        reader.readAsDataURL(file);
    }

    return profileCard;
  }

      // 프로필 카드 선택 함수
      function selectProfile(target) {
        if(target.classList.contains('selected')) {
            target.classList.remove('selected');
        } else {
            target.classList.add('selected');
        }
    }

  function openEditProfilePopup(target) {
    const name = target.querySelector('h3').textContent;
    const bio = target.querySelector('p').textContent;
    const imageSrc = target.querySelector('img').getAttribute('src');
    const profileId = target.getAttribute('data-profile-id');

    profileForm.querySelector('#name').value = name;
    profileForm.querySelector('#bio').value = bio;
    profileForm.querySelector('#photo').setAttribute('data-target', imageSrc);
    profileForm.querySelector('#photo').dataset.profileId = profileId;

    profileForm.removeEventListener('submit', saveProfile);
    profileForm.addEventListener('submit', updateProfile);

    openProfilePopup();
  }

  function updateProfile(event) {
    event.preventDefault();
      
    const updatedName = document.getElementById('name').value;
    const updatedBio = document.getElementById('bio').value;
    const photoInput = document.getElementById('photo');
    const file = photoInput.files && photoInput.files[0];

    const profileId = photoInput.dataset.profileId;

    const formData = new FormData(profileForm);
          
    fetch(`/update_profile/${profileId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const targetProfile = document.querySelector(`[data-profile-id="${profileId}"]`);
        const updatedProfileCard = createProfileCard(updatedName, updatedBio, file, profileId);
        profileContainer.replaceChild(updatedProfileCard, targetProfile);

        profileForm.reset();
        profileForm.removeEventListener('submit', updateProfile);
        profileForm.addEventListener('submit', saveProfile);

        closeProfilePopup();
      } else {
        console.error('프로필 업데이트 중 오류가 발생했습니다.');
      }
    })
    .catch(error => {
      console.error('프로필 업데이트 중 오류가 발생했습니다.', error);
    });
  }

  function deleteProfile(target) {
    const profileId = target.getAttribute("data-profile-id");

    fetch(`/delete_profile/${profileId}`, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        profileContainer.removeChild(target);
      } else {
        console.error('프로필 삭제 중 오류가 발생했습니다.');
      }
    })
    .catch(error => {
      console.error('프로필 삭제 중 오류가 발생했습니다.', error);
    });
  }

  const submitProfileBtn = document.getElementById('submit-profile-btn');
submitProfileBtn.addEventListener('click', function () {
  const selectedProfile = document.querySelector('.profile-card.selected');
  if (selectedProfile) {
    const profileId = selectedProfile.getAttribute('data-profile-id');
    window.location.href = `/chat/${profileId}`;
  } else {
    alert('프로필을 선택해주세요.');
  }
});

});
