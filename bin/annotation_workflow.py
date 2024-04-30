import json
import os
import re
from pathlib import Path

# Function to print GitHub action notice
def print_github_action_notice(file, url):
    print(f"::warning file={file},line=1::Annotation: {url}")

# Read specification URLs from JSON file
with open("bin/specification_urls.json", "r") as f:
    urls = json.load(f)

# Iterate through JSON files in tests folder and subdirectories
for root, dirs, files in os.walk("tests"):
    for file_name in files:
        if file_name.endswith(".json"):
            file_path = os.path.join(root, file_name)

            # Read the file content
            with open(file_path, 'r', encoding='utf-8') as f:
                changed_file_content = f.read()
                
            # Parse JSON content
            try:
                json_content = json.loads(changed_file_content)
                for test in json_content:
                    if "specification" in test:
                        for specification_object in test["specification"]:
                            for spec, section in specification_object.items():
                                draft = Path(file_path).parent.name
                                if spec in ["core", "validation", "hyper-schema"]:
                                    print_github_action_notice(file_path, urls[draft][spec] + section)
                                elif spec in ["quote"]:
                                    continue
                                elif spec in ["ecma262", "perl5"]:
                                    print_github_action_notice(file_path, urls[spec] + section)
                                elif re.match("^rfc\\d+$", spec):
                                    print_github_action_notice(file_path, urls["rfc"] + spec + ".txt#" + section)
                                else:
                                    print_github_action_notice(file_path, urls["iso"])
            except json.JSONDecodeError:
                print(f"Failed to parse JSON content for file: {file_path}")
