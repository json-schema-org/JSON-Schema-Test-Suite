from github import Github
import os
import sys

def commit_and_push_changes(repo, branch, commit_message):
    try:
        repo.git.add(update=True)
        repo.index.commit(commit_message)
        origin = repo.remote(name='origin')
        origin.push(refspec=branch)
        print("Changes committed and pushed successfully.")
    except Exception as e:
        print(f"Error occurred while committing and pushing changes: {str(e)}")

def main():
    # GitHub authentication using personal access token
    # Replace 'YOUR_PERSONAL_ACCESS_TOKEN' with your actual token
    g = Github(os.environ.get('GITHUB_TOKEN'))

    # Get repository and pull request number from environment variables
    repo_name = os.environ.get('GITHUB_REPOSITORY')
    
    # Extract pull request number from GITHUB_REF if it's a pull request event
    event_name = os.environ.get('GITHUB_EVENT_NAME')
    if event_name == 'pull_request':
        print(os.environ.get('GITHUB_REF'))
        pull_request_number = os.environ.get('GITHUB_REF').split('/')[-2]
        print(pull_request_number)
    else:
        print(os.environ.get('GITHUB_REF'))
        print("Not a pull request event.")
        sys.exit(1)

    if not repo_name or not pull_request_number:
        print("Repository name or pull request number not found in environment variables.")
        sys.exit(1)

    # Get repository object
    repo = g.get_repo(repo_name)

    # Get the pull request object
    pr = repo.get_pull(int(pull_request_number))

    # Get the list of changed files in the pull request
    changed_files = [file.filename for file in pr.get_files()]

    print(changed_files)
    # Filter the list to include only JSON files in the 'tests' directory
    # changed_json_files = [file for file in changed_files if file.startswith('tests/') and file.endswith('.json')]

    # if changed_json_files:
    #     # Commit and push changes
    #     commit_message = "Update JSON files"
    #     commit_and_push_changes(repo, pr.base.ref, commit_message)
    # else:
    #     print("No changes detected in JSON files.")

if __name__ == "__main__":
    main()
