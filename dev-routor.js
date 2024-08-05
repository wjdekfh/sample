const path = require("path")
const fs = require("fs");
const promiseFs = require("fs").promises;
const bodyParser = require("body-parser");
const matter = require("gray-matter");
const draftPostAbsolutePath = `${__dirname}/_draft`;

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
        
        const apiUrl = 'https://api.github.com';
        const repository = 'wjdekfh/wjdekfh.github.io';
        const branchName = 'new_blog';
        const fromPath = `${draftPostAbsolutePath}/${slug}.md`;
        const toPath = `_posts/${slug}.md`;
        // Personal access token with 'repo' scope
        const accessToken = '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';
    
        async function uploadFileToBranch() {
          try {
            // Read file content
            const fileContent = fs.readFileSync(fromPath, { encoding: 'utf-8' });
            
            // Base64 encode file content
            const contentBase64 = Buffer.from(fileContent).toString('base64');
    
            // Create data object for API request
            const requestData = {
              message: '[dwjeong] publish md file via API',
              content: contentBase64,
              branch: branchName // 특정 브랜치 이름을 지정합니다.
            };
    
            // API endpoint for creating file using Contents API
            const apiUrlContents = `${apiUrl}/repos/${repository}/contents/${toPath}`;
    
            // Make API request with 'ref' parameter to specify branch
            const response = await fetch(apiUrlContents, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData)
            });
            
            const responseData = await response.json();
            fs.rename(fromPath, toPath, (err) => {
              if (err) {
                console.error('Published post file:', err);
              }
            });
          } catch (error) {
            console.error('Error uploading file to branch:', error);
          }
        }

        // Call the function to upload the file to a specific branch
        await uploadFileToBranch();

        setTimeout(() => {
          return res.status(200).send('publish successfully');
        }, 3000);
    });

    app.post('/api/unpublish', async (req, res) => {
      const slug = req.body.slug;
      
      const apiUrl = 'https://api.github.com';
      const repository = 'wjdekfh/wjdekfh.github.io';
      const branchName = 'new_blog';
      const remotePath = `remote/_posts/${slug}.md`;
      const copyPath = `_draft/${slug}.md`;
      const gitPath = `_posts/${slug}.md`;

      // Personal access token with 'repo' scope
      const accessToken = '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';
  
      async function uploadFileToBranch() {
        try {

          console.log(`copy ${remotePath} to ${copyPath}`)

          const fileInfoUrl = `${apiUrl}/repos/${repository}/contents/${gitPath}?ref=${branchName}`;
          const fileInfoResponse = await fetch(fileInfoUrl, {
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (!fileInfoResponse.ok) {
            throw new Error(`Error fetching file info: ${fileInfoResponse.statusText}`);
          }

          const fileInfo = await fileInfoResponse.json();
          const sha = fileInfo.sha; // Get the SHA of the file

          // API endpoint for creating file using Contents API
          const apiUrlContents = `${apiUrl}/repos/${repository}/contents/${gitPath}`;

          // Create data object for API request
          const requestData = {
            message: '[dwjeong] Unpublish md file via API',
            branch: branchName, // 특정 브랜치 이름을 지정합니다.
            sha: sha,
          };
  
          // Make API request with 'ref' parameter to specify branch
          const response = await fetch(apiUrlContents, {
            method: 'DELETE',
            headers: {
              'Authorization': `token ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          });
          
          const responseData = await response.json();
          console.log(responseData)

          // remote파일 복사
          await promiseFs.rename(gitPath, copyPath);

        } catch (error) {
          console.error('Error uploading file to branch:', error);
        }
      }
  
      // Call the function to upload the file to a specific branch
      await uploadFileToBranch();

      setTimeout(() => {
        return res.status(200).send('publish successfully');
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

    console.log(deleteFilePath);

    fs.unlink(deleteFilePath, (err) => {
      if (err) {
        return false;
      }
      
      return true;
    });
}






module.exports = routor;