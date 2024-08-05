const path = require("path")
const fs = require("fs");
const promiseFs = require("fs").promises;
const bodyParser = require("body-parser");
const matter = require("gray-matter");
const draftPostAbsolutePath = `${__dirname}/_draft`;

const simpleGit = require("simple-git");
const git = simpleGit();

const routor = (app) => {
    app.use(bodyParser.json());

    app.post('/api/post', (req, res) => {
        const postData = req.body;

        const isSuccess = createNewPost(postData);

        // Gatsby BuildTime 시간을 벌기위해서 3초 강제 딜레이
        setTimeout(() => {
            if (isSuccess) {
              return res.status(200).send('New post saved successfully');
            } else {
              return res.status(500).send('Internal Server Error');
            }
        }, 3000);
    });

    app.delete('/api/post', (req, res) => {
        const { slug } = req.body;

        const isSuccess = deleteDraftPost(slug);

        // Gatsby BuildTime 시간을 벌기위해서 3초 강제 딜레이
        setTimeout(() => {
            if (isSuccess) {
                return res.status(200).send('Draft post delete successfully');
            } else {
                return res.status(500).send('Internal Server Error');
            }
        }, 3000);
    });

    app.put('/api/post', (req, res) => {
      const postData = req.body;

      const isSuccess = updatePost(postData);

      // Gatsby BuildTime 시간을 벌기위해서 3초 강제 딜레이
      setTimeout(() => {
          if (isSuccess) {
            return res.status(200).send('Post update successfully');
          } else {
            return res.status(500).send('Internal Server Error');
          }
      }, 3000);
  });
  
    app.post('/api/publish', async (req, res) => {
        const slug = req.body.slug;
        
        const fromPath = `_draft/${slug}.md`;
        const toPath = `_posts/${slug}.md`;

        // draft 파일을 배포 경로 _post로 이동
        await promiseFs.rename(fromPath, toPath);

        // git add file
        await git.add(toPath);
        console.log('Files added to staging area...', toPath);

        // local commit
        await git.commit('Publish posts...');
        console.log('Files committed...', toPath);

        // remote push
        await git.push('origin', 'main');
        console.log('pushed to remote repository...', toPath);

        setTimeout(() => {
          return res.status(200).send('publish successfully');
        }, 3000);
    });

    app.post('/api/unpublish', async (req, res) => {
      const slug = req.body.slug;

      const fromPath = `_posts/${slug}.md`;
      const toPath = `_draft/${slug}.md`;

      //  배포경로 파일을 draft 로 이동
      await promiseFs.rename(fromPath, toPath);
      
      // git remove file
      await git.add(fromPath);
      console.log('Files remove to staging area...', toPath);

      // local commit
      await git.commit('Unpublish posts...');
      console.log('Files committed...', fromPath);

      // remote push
      await git.push('origin', 'main');
      console.log('Unpushed to remote repository...', fromPath);

      setTimeout(() => {
        return res.status(200).send('Unpublish successfully');
      }, 3000);
  });
}

/*
* 신규 포스트 생성
*/
const createNewPost = (post) => {
    const { content, frontmatter, date, slug } = post;

    // content + frontmatter = 'md' format text
    const textData = matter.stringify(content, frontmatter);
  
    if (textData) {
        const filename = `${date}-${slug}.md`;
        const newPostFilePath = `${draftPostAbsolutePath}/${filename}`;

        console.log("Create New post... ", newPostFilePath);
        fs.writeFile(newPostFilePath, textData, 'utf8', (err) => {
          if (err) {
            return false;
          }
          
          return true;
        });
    } else {
      return false;
    }
}

const updatePost = (post) => {
    const { content, frontmatter, date, slug } = post;

    // content + frontmatter = 'md' format text
    const textData = matter.stringify(content, frontmatter);

    if (textData) {
        const filename = `${date}-${slug}.md`;
        const editPostFilePath = `${draftPostAbsolutePath}/${filename}`;

        console.log("Update post... ", editPostFilePath);
        fs.writeFile(editPostFilePath, textData, 'utf8', (err) => {
          if (err) {
            return false;
          }
          
          return true;
        });
    } else {
      return false;
    }
}

/*
* Draft(초안) 포스트 삭제
*/
const deleteDraftPost = (slug) => {
    const deleteFilePath = `${draftPostAbsolutePath}/${slug}.md`;
    console.log("Delete post... ", deleteFilePath);

    fs.unlink(deleteFilePath, (err) => {
      if (err) {
        return false;
      }
      
      return true;
    });
}






module.exports = routor;