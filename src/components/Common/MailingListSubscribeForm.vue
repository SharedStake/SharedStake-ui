<template>
  <div>
    <div id="mc_embed_signup">
      <form
        action="https://sharedstake.us1.list-manage.com/subscribe/post?u=6cb6b636781c4fcc0b7cbccf1&amp;id=1e3ebab5ba"
        method="post"
        id="mc-embedded-subscribe-form"
        name="mc-embedded-subscribe-form"
        class="validate"
        target="_blank"
        novalidate
      >
        <div id="mc_embed_signup_scroll">
          
          <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
          <div style="position: absolute; left: -5000px" aria-hidden="true">
            <input
              type="text"
              name="b_6cb6b636781c4fcc0b7cbccf1_1e3ebab5ba"
              tabindex="-1"
              value=""
            />
          </div>
            <div class="subscribe">
                <div class="input-container">
                    <input
                        type="email"
                        value=""
                        name="EMAIL"
                        class="email"
                        id="mce-EMAIL"
                        placeholder="email address"
                        required
                    />
                    <input
                        type="submit"
                        value="Subscribe"
                        name="subscribe"
                        id="mc-embedded-subscribe"
                        class="submit-button"
                    />
                </div>
            </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.subscribe {
  font-size: 21px;
  border: 2px solid #fff;
  border-radius: 10px;
  transition: transform 0.5s ease-out;
  width: 65%;
  margin: 0 auto;
}

.input-container {
  display: flex;
}

input {   
  padding: 0.5rem 1.5rem 0.5rem 1.5rem;
  margin: 0;
  text-decoration: none;
  font-family: "Roboto";
  color: #fff;
  border: none;
  background: none;
  font-size: 21px;
  width: 50%;
}

.submit-button {
  cursor: pointer;
}

.email {
  color: black;
  background: #fff;
  font-size: 21px;
  border: 2px solid #fff;
  border-style: solid none solid solid;
  border-radius: 5px 0 0 5px;
  text-align: center;
  /* width: 142px; */
  transition: transform 0.5s ease-out;
}

@media only screen and (max-width: 1270px) {
  .subscribe {
    width: 95%;
  }

  .email {
    width: 60%
  }

  .submit-button {
    width: 40%;
  }
}
</style>